import {
  mockActivities,
  mockHubs,
  mockProjects,
  mockSurveys,
  mockUnpublished,
  mockUsers,
  type MockUser,
} from '../../data';
import type {
  BioCollectBioActivity,
  BioCollectHub,
  BioCollectOfflineActivitySummary,
  BioCollectProject,
  BioCollectSurvey,
} from '#/types';

const STORAGE_KEYS = {
  PROJECTS: 'biocollect_mock_projects',
  SURVEYS: 'biocollect_mock_surveys',
  ACTIVITIES: 'biocollect_mock_activities',
  OFFLINE: 'biocollect_mock_offline_activities',
  USERS: 'biocollect_mock_users',
  ACTIVE_USER: 'biocollect_mock_active_user',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`[MockDB] Failed to save to localStorage (${key}):`, err);
  }
}

class MockDatabase {
  private projects: BioCollectProject[];
  private surveys: BioCollectSurvey[];
  private activities: BioCollectBioActivity[];
  private offlineActivities: BioCollectOfflineActivitySummary[];
  private hubs: BioCollectHub[];
  private users: MockUser[];

  constructor() {
    this.projects = loadFromStorage(STORAGE_KEYS.PROJECTS, mockProjects);
    this.surveys = loadFromStorage(STORAGE_KEYS.SURVEYS, mockSurveys);
    this.activities = loadFromStorage(STORAGE_KEYS.ACTIVITIES, mockActivities);
    this.offlineActivities = loadFromStorage(
      STORAGE_KEYS.OFFLINE,
      mockUnpublished.activities as BioCollectOfflineActivitySummary[],
    );
    this.hubs = mockHubs;
    this.users = mockUsers;
  }

  // --- Hubs ---
  getHubs(): BioCollectHub[] {
    return this.hubs;
  }

  // --- Projects ---
  getProjects(options: {
    hub?: string;
    query?: string;
    sort?: string;
    offset?: number;
    max?: number;
    isUserPage?: boolean;
  }): { total: number; projects: BioCollectProject[] } {
    let result = [...this.projects];

    // Filter by hub
    if (options.hub) {
      result = result.filter((p) => p.hub === options.hub || !p.hub);
    }

    // Filter by search query
    if (options.query) {
      const q = options.query.replace(/\*/g, '').trim().toLowerCase();
      if (q) {
        result = result.filter((p) => {
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchAim = p.aim.toLowerCase().includes(q);
          const matchOrg = p.organisationName?.toLowerCase().includes(q);
          const matchTags = p.tags?.some((t) => t.toLowerCase().includes(q));
          const matchKeywords = p.keywords?.some((k) => k.toLowerCase().includes(q));
          return matchName || matchDesc || matchAim || matchOrg || matchTags || matchKeywords;
        });
      }
    }

    // Filter by user page (if isUserPage=true, show user's member projects)
    if (options.isUserPage) {
      result = result.filter((p) => p.userIsProjectMember !== false);
    }

    // Sort projects
    const sort = options.sort || 'dateCreatedSort';
    if (sort === 'nameSort') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'organisationSort') {
      result.sort((a, b) => (a.organisationName || '').localeCompare(b.organisationName || ''));
    } else {
      // dateCreatedSort / default
      result.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }

    const total = result.length;
    const offset = options.offset || 0;
    const max = options.max || 10;
    const paginated = result.slice(offset, offset + max).map((p) => ({
      ...p,
      projectActivities:
        p.projectActivities && p.projectActivities.length > 0
          ? p.projectActivities
          : this.getSurveys(p.projectId),
    }));

    return {
      total,
      projects: paginated,
    };
  }

  getProjectById(projectId: string): BioCollectProject | null {
    const p = this.projects.find((item) => item.projectId === projectId);
    if (!p) return null;
    return {
      ...p,
      projectActivities:
        p.projectActivities && p.projectActivities.length > 0
          ? p.projectActivities
          : this.getSurveys(p.projectId),
    };
  }

  // --- Surveys ---
  getSurveys(projectId?: string): BioCollectSurvey[] {
    if (projectId) {
      // Return surveys belonging to that project
      return this.surveys.filter((s) => s.projectId === projectId);
    }
    return this.surveys;
  }

  // --- Activities ---
  getActivities(options: {
    view?: string;
    projectId?: string;
    projectActivityId?: string;
    surveyName?: string;
    searchTerm?: string;
    offset?: number;
    max?: number;
    fq?: string[] | string;
  }): { activities: BioCollectBioActivity[] } {
    let result = [...this.activities];

    // Extract filters from fq if provided
    let filterProjectId = options.projectId;
    let filterSurveyName = options.surveyName;

    if (options.fq) {
      const fqList = Array.isArray(options.fq) ? options.fq : [options.fq];
      for (const filter of fqList) {
        if (filter.startsWith('projectId:')) {
          filterProjectId = filter.replace('projectId:', '').trim();
        } else if (filter.startsWith('projectActivityNameFacet:')) {
          filterSurveyName = filter.replace('projectActivityNameFacet:', '').trim();
        }
      }
    }

    if (filterProjectId) {
      result = result.filter((a) => a.projectId === filterProjectId);
    }

    if (filterSurveyName) {
      result = result.filter((a) => a.name === filterSurveyName || a.type === filterSurveyName);
    }

    if (options.projectActivityId) {
      result = result.filter((a) => a.projectActivityId === options.projectActivityId);
    }

    // Search term filtering
    if (options.searchTerm) {
      const q = options.searchTerm.trim().toLowerCase();
      result = result.filter((a) => {
        const matchName = a.name.toLowerCase().includes(q);
        const matchOwner = a.activityOwnerName?.toLowerCase().includes(q);
        const matchRecords = a.records?.some(
          (r) =>
            r.commonName?.toLowerCase().includes(q) ||
            r.name?.toLowerCase().includes(q) ||
            r.multimedia?.title?.toLowerCase().includes(q),
        );
        return matchName || matchOwner || matchRecords;
      });
    }

    // Offset and max
    const offset = options.offset || 0;
    const max = options.max || 20;
    const paginated = result.slice(offset, offset + max);

    return { activities: paginated };
  }

  deleteActivity(activityId: string): boolean {
    const beforeCount = this.activities.length;
    this.activities = this.activities.filter((a) => a.activityId !== activityId);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);
    return this.activities.length < beforeCount;
  }

  // --- Offline / Unpublished Activities ---
  getOfflineActivities(): BioCollectOfflineActivitySummary[] {
    this.offlineActivities = loadFromStorage(
      STORAGE_KEYS.OFFLINE,
      this.offlineActivities,
    );
    return this.offlineActivities;
  }

  addOfflineActivity(
    activity: Partial<BioCollectOfflineActivitySummary> & {
      projectActivityId: string;
      projectId: string;
      name: string;
    },
  ): BioCollectOfflineActivitySummary {
    const newAct: BioCollectOfflineActivitySummary = {
      activityId: `offline-${Date.now()}`,
      isInvalidDraft: false,
      uploadFlag: true,
      name: activity.name,
      projectActivityId: activity.projectActivityId,
      projectId: activity.projectId,
      species: activity.species || [],
      surveyDate: activity.surveyDate || new Date().toISOString(),
      type: activity.type || activity.name,
      featureImage: activity.featureImage || null,
      transients: {
        viewActivityUrl: `/pwa/bioActivity/view/offline-${Date.now()}`,
        editActivityUrl: `/pwa/bioActivity/edit/${activity.projectActivityId}?activityId=offline-${Date.now()}`,
      },
    };

    this.offlineActivities.unshift(newAct);
    saveToStorage(STORAGE_KEYS.OFFLINE, this.offlineActivities);
    return newAct;
  }

  deleteOfflineActivity(projectActivityId: string, activityId: string): boolean {
    const before = this.offlineActivities.length;
    this.offlineActivities = this.offlineActivities.filter(
      (a) => !(a.activityId === activityId && a.projectActivityId === projectActivityId),
    );
    saveToStorage(STORAGE_KEYS.OFFLINE, this.offlineActivities);
    return this.offlineActivities.length < before;
  }

  uploadOfflineActivity(
    projectActivityId: string,
    activityId: string,
  ): BioCollectBioActivity | null {
    const offlineItem = this.offlineActivities.find(
      (a) => a.activityId === activityId && a.projectActivityId === projectActivityId,
    );
    if (!offlineItem) return null;

    // Convert to published activity
    const newPublished: BioCollectBioActivity = {
      activityId: `pub-${Date.now()}`,
      projectActivityId: offlineItem.projectActivityId,
      projectId: offlineItem.projectId,
      projectName: offlineItem.name,
      name: offlineItem.name,
      type: offlineItem.type,
      status: 'active',
      lastUpdated: new Date().toISOString(),
      endDate: new Date().toISOString(),
      userId: 'mock-user-ecologist-001',
      activityOwnerName: 'Alex Citizen',
      siteId: 'site-local-01',
      embargoed: false,
      embargoUntil: '',
      projectType: 'citizenScience',
      thumbnailUrl:
        offlineItem.featureImage?.thumbnailUrl ||
        'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=300&auto=format&fit=crop&q=80',
      showCrud: true,
      userCanModerate: true,
      records: (offlineItem.species || []).map((sp, idx) => ({
        commonName: sp.commonName || sp.name,
        name: sp.scientificName || sp.name,
        individualCount: 1,
        coordinates: [-33.8688, 151.2093],
        eventDate: new Date().toISOString().split('T')[0],
        eventTime: new Date().toLocaleTimeString(),
        guid: sp.guid || '',
        occurrenceID: `occ-mock-${Date.now()}-${idx}`,
        multimedia: {
          rightsHolder: 'Alex Citizen',
          identifier:
            offlineItem.featureImage?.thumbnailUrl ||
            'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&auto=format&fit=crop&q=80',
          license: 'CC-BY 4.0',
          creator: 'Alex Citizen',
          imageId: `img-${Date.now()}`,
          rights: 'CC-BY 4.0',
          format: 'image/jpeg',
          documentId: `doc-${Date.now()}`,
          title: sp.commonName || sp.name,
          type: 'StillImage',
        },
      })),
    };

    // Add to published
    this.activities.unshift(newPublished);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, this.activities);

    // Remove from offline
    this.deleteOfflineActivity(projectActivityId, activityId);

    return newPublished;
  }

  uploadAllOfflineActivities(projectActivityId?: string): {
    processed: number;
    total: number;
    failed: number;
    failures: unknown[];
  } {
    const allActivities = this.getOfflineActivities();
    const toUpload = projectActivityId
      ? allActivities.filter((a) => a.projectActivityId === projectActivityId)
      : [...allActivities];

    let processed = 0;
    for (const item of toUpload) {
      this.uploadOfflineActivity(item.projectActivityId, item.activityId);
      processed++;
    }

    return {
      processed,
      total: toUpload.length,
      failed: 0,
      failures: [],
    };
  }

  // --- Users ---
  getUsers(): MockUser[] {
    return this.users;
  }

  getUserById(userId: string): MockUser | null {
    return this.users.find((u) => u.id === userId) || null;
  }

  getActiveUser(): MockUser {
    const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    const found = activeId ? this.getUserById(activeId) : null;
    return found || this.users[0];
  }

  setActiveUser(userId: string): MockUser {
    const user = this.getUserById(userId) || this.users[0];
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, user.id);
    return user;
  }

  // --- Reset to initial defaults ---
  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.SURVEYS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.OFFLINE);
    this.projects = [...mockProjects];
    this.surveys = [...mockSurveys];
    this.activities = [...mockActivities];
    this.offlineActivities = [
      ...(mockUnpublished.activities as BioCollectOfflineActivitySummary[]),
    ];
  }
}

export const mockDb = new MockDatabase();
