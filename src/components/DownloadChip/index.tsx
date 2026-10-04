import { Button, type ButtonProps, Text } from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconCheck, IconDownload, IconPlugOff } from '@tabler/icons-react';
import { useContext } from 'react';
import { FrameContext } from '#/helpers/frame';

// Helpers

import { getBioCollectUrl, isSurveyDownloaded, markSurveyDownloaded } from '#/helpers/funcs';

interface DownloadChipProps extends Omit<ButtonProps, 'children'> {
  survey?: BioCollectSurvey;
  onLine?: boolean;
  downloaded?: boolean;
}

export function DownloadChip({ survey, onLine, downloaded, ...rest }: DownloadChipProps) {
  const frame = useContext(FrameContext);

  const surveyKey = survey?.id || survey?.projectActivityId;
  const isDownloaded = downloaded ?? (survey ? isSurveyDownloaded(survey.projectId, surveyKey) : false);

  // Handler for the download popup
  const handleDownload = () =>
    frame.open(
      getBioCollectUrl(`/pwa?projectActivityId=${survey?.projectActivityId}`),
      `Downloading - ${survey?.name}`,
      {
        confirm: async () => {
          if (survey && surveyKey) {
            console.log(`Downloading ${survey.name}...`);
            await new Promise(resolve => setTimeout(resolve, 500));
            markSurveyDownloaded(survey.projectId, surveyKey);
          }

          frame.close();
        },
      },
    );

  // Handler for the chip callback
  const handleChipClick = () => {
    if (!survey) return;
    if (isDownloaded) {
      modals.openConfirmModal({
        title: (
          <Text size='lg' ff='heading'>
            Confirm Re-Download
          </Text>
        ),
        centered: true,
        children: (
          <Text>
            You have already downloaded <b>{survey.name}</b>. Click <b>Confirm</b> to redownload.
          </Text>
        ),
        labels: {
          confirm: 'Confirm',
          cancel: 'Cancel',
        },
        confirmProps: {
          'data-testid': 'redownload-confirm',
        },
        onConfirm: async () => {
          console.log(`Re-downloading ${survey.name}...`);
          handleDownload();
        },
      });
    } else {
      handleDownload();
    }
  };

  let Icon = IconDownload;
  if (isDownloaded) {
    Icon = IconCheck;
  } else if (!onLine) {
    Icon = IconPlugOff;
  }

  return (
    <Button
      id={`${survey?.projectActivityId}Download`}
      size='xs'
      variant='light'
      disabled={!onLine}
      onClick={handleChipClick}
      leftSection={<Icon size="1rem" />}
      maw={250}
      {...rest}
    >
      {isDownloaded ? 'Downloaded' : 'Download'}
    </Button>
  );
}
