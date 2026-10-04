const STORAGE_KEY = 'lookaround_downloaded_surveys';
const EVENT_KEY = 'lookaround_downloaded_surveys_updated';

export type DownloadedSurveysMap = { [projectId: string]: { [surveyId: string]: true } };

export function getDownloadedSurveys(): DownloadedSurveysMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse error
  }
  return {};
}

export function isSurveyDownloaded(projectId?: string, surveyId?: string): boolean {
  if (!projectId || !surveyId) return false;
  const map = getDownloadedSurveys();
  return Boolean(map[projectId]?.[surveyId]);
}

export function markSurveyDownloaded(projectId: string, surveyId: string): void {
  try {
    const map = getDownloadedSurveys();
    if (!map[projectId]) {
      map[projectId] = {};
    }
    map[projectId][surveyId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: map }));
  } catch (err) {
    console.error('Failed to save downloaded survey state:', err);
  }
}

export function subscribeDownloadedSurveys(callback: (map: DownloadedSurveysMap) => void): () => void {
  const handler = (e: Event) => {
    const custom = e as CustomEvent<DownloadedSurveysMap>;
    callback(custom.detail || getDownloadedSurveys());
  };
  window.addEventListener(EVENT_KEY, handler);
  return () => window.removeEventListener(EVENT_KEY, handler);
}
