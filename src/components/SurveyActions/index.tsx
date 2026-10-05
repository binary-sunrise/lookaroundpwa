import { Button, Flex, type FlexProps, Skeleton } from '@mantine/core';
import { IconEye, IconPlus } from '@tabler/icons-react';
import { useContext } from 'react';
import { RecordsDrawerContext } from '#/helpers/drawer';
import { FrameContext } from '#/helpers/frame';
import { getBioCollectUrl } from '#/helpers/funcs';

interface SurveyActionsProps extends FlexProps {
  survey?: BioCollectSurvey;
  onLine?: boolean;
  downloaded?: boolean;
}

export function SurveyActions({ survey, onLine, downloaded, ...rest }: SurveyActionsProps) {
  const drawer = useContext(RecordsDrawerContext);
  const frame = useContext(FrameContext);

  return (
    <Flex gap={4} align='center' {...rest}>
      <Skeleton visible={!survey}>
        <Button
          id={survey && `${survey.projectActivityId}ViewRecord`}
          variant='subtle'
          px={6}
          leftSection={<IconEye size='1rem' />}
          size='xs'
          onClick={
            survey &&
            (() => {
              drawer.open(
                survey,
              );
            })
          }>
          Records
        </Button>
      </Skeleton>
      <Skeleton visible={!survey}>
        <Button
          id={survey && `${survey.projectActivityId}AddRecord`}
          variant='subtle'
          disabled={!onLine && !downloaded}
          leftSection={<IconPlus size='1rem' />}
          px={6}
          size='xs'
          onClick={
            survey &&
            (() => {
              const editUrl = getBioCollectUrl(
                `/pwa/bioActivity/edit/${survey.projectActivityId}?unpublished=true&projectId=${survey.projectId}&projectActivityId=${survey.projectActivityId}&surveyName=${encodeURIComponent(survey.name)}`,
              );
              frame.open(
                editUrl,
                `Add Record - ${survey.name}`,
                {
                  close: (closeData?: any) => {
                    const isOnlineRecord = closeData?.createdOnline === true;
                    // If created directly online, open drawer directly to Published tab!
                    // If offline, open to Unpublished tab!
                    drawer.open(
                      survey,
                      !isOnlineRecord,
                    );
                  },
                },
              );
            })
          }
        >
          Add
        </Button>
      </Skeleton>
    </Flex>
  );
}
