import axios from 'axios';

// Helpers
import { toQueryString } from '#/helpers/funcs';
import type {
  BioCollectBioActivity,
  BioCollectBioActivitySearch,
  BioCollectBioActivityView,
  BioCollectHub,
  BioCollectProject,
  BioCollectProjectSearch,
  BioCollectSurvey,
  FilterQueries,
} from '#/types';

// Local classes
import { getHubId } from '#/helpers/funcs/useHub';

const filterActiveSurveys = (surveys: BioCollectSurvey[], userIsProjectMember = false) =>
  surveys?.filter(
    ({ startDate, endDate, published, publicAccess }) =>
      new Date(startDate).getTime() <= Date.now() &&
      (!endDate || new Date(endDate).getTime() >= Date.now()) &&
      (published !== undefined ? published : true) &&
      (userIsProjectMember || publicAccess === true),
  ) || [];

const formatProject = (project: BioCollectProject) => ({
  ...project,
  name: project.name.trim(),
  projectActivities: filterActiveSurveys(
    project.projectActivities,
    project.userIsProjectMember === true,
  ),
});

const formatProjects = (projects: BioCollectProject[]) => {
  return projects.map((project) => formatProject(project));
};

const formatProjectSearch = (search: BioCollectProjectSearch) => ({
  ...search,
  projects: formatProjects(search.projects),
});

type BioCollectProjectSort = 'dateCreatedSort' | 'nameSort' | '_score' | 'organisationSort';

export default () => ({
  projectSearch: async (
    offset = 0,
    max = 30,
    sort: BioCollectProjectSort | string = 'dateCreatedSort',
    isUserPage = false,
    search?: string,
    _hasDownloadedSurveys = true,
  ): Promise<BioCollectProjectSearch> => {
    const hubId = getHubId();

    // Define basic query parameters
    const params = new URLSearchParams({
      fq: 'isExternal:F',
      initiator: 'biocollect',
      sort,
      mobile: 'true',
      max: max.toString(),
      offset: offset.toString(),
      isUserPage: isUserPage.toString(),
      hub: hubId,
    });

    // Append public projects filter query
    params.append('fq', 'allParticipants:ALL');

    // Append user search
    if (search && search.length > 0) {
      const searchQuery = `*${search.toLocaleLowerCase()}*`;
      params.append('q', searchQuery);
      params.append('queryText', searchQuery);
    }

    // Make the GET request
    const { data } = await axios.get<BioCollectProjectSearch>(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/project/search?${params.toString()}`,
    );
    const formattedSearch = formatProjectSearch(data);

    // Add the hub ID to the stored projects
    formattedSearch.projects.forEach((project) => {
      project.hub = hubId;
    });

    return formattedSearch;
  },
  
  getProject: async (projectId: string): Promise<BioCollectProject | null> => {
    try {
      // Make the GET request
      const { data } = await axios.get<BioCollectProject>(
        `${import.meta.env.VITE_API_BIOCOLLECT}/ws/project/${projectId}`,
      );

      return formatProject(data);
    } catch {
      return null;
    }
  },

  listSurveys: async (
    projectId: string,
    userIsProjectMember = false,
  ): Promise<BioCollectSurvey[]> => {
    // Make the GET request
    let { data: surveys } = await axios.get<BioCollectSurvey[]>(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/survey/list/${projectId}`,
    );

    // Filter out non-active surveys (not within date range)
    surveys = filterActiveSurveys(surveys, userIsProjectMember);

    return surveys;
  },

  searchActivities: async (
    view: BioCollectBioActivityView,
    filters: FilterQueries = {},
  ): Promise<BioCollectBioActivitySearch> => {
    const base = `${import.meta.env.VITE_API_BIOCOLLECT}/ws/bioactivity/search`;

    //Transform the FilterQueries object
    const qs = toQueryString({ view, ...filters });
    const url = `${base}?${qs}`;

    // Make the GET request
    const { data } = await axios.get<BioCollectBioActivitySearch>(url);
    return data;
  },

  listHubs: async (): Promise<BioCollectHub[]> => {
    const { data } = await axios.get<BioCollectHub[]>(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/hub/pwaList`,
    );
    return data;
  },

  deleteActivity: async (activityId: string): Promise<void> => {
    await axios.delete(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/bioactivity/delete/${activityId}`,
    );
  },

  createActivity: async (activityData: Partial<BioCollectBioActivity>): Promise<BioCollectBioActivity> => {
    const { data } = await axios.post<BioCollectBioActivity>(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/bioactivity/create`,
      activityData,
    );
    return data;
  },

  updateActivity: async (activityId: string, updates: Partial<BioCollectBioActivity>): Promise<BioCollectBioActivity> => {
    const { data } = await axios.put<BioCollectBioActivity>(
      `${import.meta.env.VITE_API_BIOCOLLECT}/ws/bioactivity/update/${activityId}`,
      updates,
    );
    return data;
  },
});
