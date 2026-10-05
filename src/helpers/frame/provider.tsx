import { Frame } from '#/components';
import { getBioCollectBaseUrl, getBioCollectTargetOrigin, isFrame } from '#/helpers/funcs';
import { Box, Button, Group, Modal, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { jwtDecode } from 'jwt-decode';
import {
  type PropsWithChildren,
  type ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { userManager } from '../auth';
import FrameContext, { type FrameCallbacks } from './context';
import { modals } from '@mantine/modals';

interface FrameEvent {
  event: 'download-complete' | 'confirm-download' | 'download-removed' | 'surveys-removed' | 'close-frame';
  data?: any;
}

const FrameProvider = (props: PropsWithChildren): ReactElement => {
  const [title, setTitle] = useState<string | null>(null);
  const [src, setSrc] = useState<string | null>();
  const [canConfirm, setCanConfirm] = useState<boolean | null>(null);
  const [opened, { open: openFrame, close: closeFrame }] = useDisclosure(false);
  const callbacks = useRef<FrameCallbacks>(null);

  // Refs & theming
  const frameRef = useRef<HTMLIFrameElement>(null);

  // Callback function to pass user credentials when IFrame has loaded
  const postToken = useCallback(async () => {
    if (frameRef?.current?.contentWindow) {
      try {
        const user = await userManager.getUser();
        let decodedUserId: number | undefined;

        if (user?.access_token && typeof user.access_token === 'string' && user.access_token.split('.').length === 3) {
          try {
            decodedUserId = (jwtDecode(user.access_token) as { userid: number })?.userid;
          } catch {
            decodedUserId = undefined;
          }
        }

        frameRef.current.contentWindow.postMessage(
          {
            event: 'credentials',
            data: {
              userId: user?.profile?.['custom:userid'] || user?.id || decodedUserId,
              token: user?.access_token,
              baseUrl: getBioCollectBaseUrl(),
            },
          },
          getBioCollectTargetOrigin(),
        );
      } catch (err) {
        console.warn('[FrameProvider] Could not post credentials to frame:', err);
      }
    }
  }, []);

  // Callback function to open the records drawer
  const open = useCallback((newSrc: string, newTitle: string, newCallbacks?: FrameCallbacks) => {
    setSrc(newSrc);
    setTitle(newTitle);

    // Update callbacks/confirmation state
    if (newCallbacks) {
      callbacks.current = newCallbacks;
      if (newCallbacks.confirm) {
        setCanConfirm(false);
      }
    }

    openFrame();
  }, []);

  const handleClose = useCallback((closeData?: any) => {
    // Trigger the close callback with returned mutation data
    if (callbacks?.current?.close) {
      callbacks.current.close(closeData);
    }

    setSrc(null);
    setTitle(null);
    setCanConfirm(null);
    callbacks.current = null;

    closeFrame();
  }, [closeFrame]);

  useEffect(() => {
    if (isFrame()) {
      return undefined;
    }

    // Define a message handler to listen for download and close events
    const messageHandler = (message: MessageEvent<FrameEvent>) => {
      const { data } = message;

      if (data?.event === 'download-complete') {
        setCanConfirm(true);
      } else if (data?.event === 'confirm-download') {
        setCanConfirm(true);
        if (callbacks.current?.confirm) {
          callbacks.current.confirm();
        }
      } else if (data?.event === 'download-removed') {
        setCanConfirm(false);
      } else if (data?.event === 'surveys-removed') {
        // Offline cache removed
      } else if (data?.event === 'close-frame') {
        handleClose(data?.data);
      }
    };

    // Subscribe & setup unmount callback
    window.addEventListener('message', messageHandler);
    return () => window.removeEventListener('message', messageHandler);
  }, [handleClose]);

  const close = () => {
    // Show confirmation dialog for edit / add dialogs
    if (title?.startsWith('Edit') || title?.startsWith('Add')) {
      modals.openConfirmModal({
        centered: true,
        title: (
          <Text size='lg' ff='heading'>
            Are you sure you want to close this dialog?
          </Text>
        ),
        children: <Text>Any unsaved data will be lost</Text>,
        labels: {
          confirm: 'Close',
          cancel: 'Cancel',
        },
        confirmProps: {
          'data-testid': 'modal-confirm-close',
        },
        onConfirm: handleClose,
        zIndex: 2000,
      });
    } else {
      handleClose();
    }
  };

  return (
    <FrameContext.Provider value={{ open, close }}>
      <Modal
        fullScreen
        opened={opened}
        onClose={close}
        title={
          <Text size='lg' ff='heading' lineClamp={1}>
            {title || 'BioCollect'}
          </Text>
        }
        zIndex={1000}
        styles={{
          content: {
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh',
          },
          body: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        }}
        radius={0}
      >
        {src && (
          <Box
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <Frame ref={frameRef} src={src} allow='geolocation;' onLoad={postToken} />
            {canConfirm !== null && (
              <Group mt='sm' justify='center' gap='xs' px='md' pb='md' style={{ flexShrink: 0 }}>
                <Button
                  id='confirmDownloadModal'
                  onClick={callbacks.current?.confirm}
                  loading={!canConfirm}
                >
                  Confirm Download
                </Button>
                <Button onClick={close} color='gray'>
                  Cancel
                </Button>
              </Group>
            )}
          </Box>
        )}
      </Modal>
      {props.children}
    </FrameContext.Provider>
  );
};

export default FrameProvider;
