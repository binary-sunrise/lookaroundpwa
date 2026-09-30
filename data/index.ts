import hubsData from './hubs.json';
import projectsData from './projects.json';
import surveysData from './surveys.json';
import activitiesData from './activities.json';
import unpublishedData from './unpublishedActivities.json';
import usersData from './users.json';

import type {
  BioCollectHub,
  BioCollectProject,
  BioCollectSurvey,
  BioCollectBioActivity,
} from '#/types';

export interface MockUser {
  id: string;
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  email: string;
  email_verified: boolean;
  role: string;
  roles: string[];
  'custom:userid': string;
  avatar: string;
  organisation: string;
}

export const mockHubs = hubsData as BioCollectHub[];
export const mockProjects = projectsData as BioCollectProject[];
export const mockSurveys = surveysData as BioCollectSurvey[];
export const mockActivities = activitiesData as BioCollectBioActivity[];
export const mockUnpublished = unpublishedData;
export const mockUsers = usersData as MockUser[];

export default {
  hubs: mockHubs,
  projects: mockProjects,
  surveys: mockSurveys,
  activities: mockActivities,
  unpublished: mockUnpublished,
  users: mockUsers,
};
