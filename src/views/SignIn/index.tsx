import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  PasswordInput,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconBrandGithub,
  IconBrandGoogle,
  IconDatabase,
  IconLeaf,
  IconLock,
  IconMail,
  IconShieldCheck,
  IconUser,
} from '@tabler/icons-react';

import { Background } from '#/components';
import { Logo } from '#/components/Logo';
import { AssistButtons } from '#/layout/AssistButtons';
import { useAuth, authClient } from '#/helpers/auth';
import splash from '/assets/splash.jpg';
import classes from './index.module.css';

// Pre-seeded test accounts for instant 1-click evaluation
const DEMO_ACCOUNTS = [
  {
    name: 'Alex Citizen',
    email: 'alex.citizen@ala.org.au',
    role: 'Lead Ecologist',
    initials: 'AC',
    color: 'teal',
  },
  {
    name: 'Jane Volunteer',
    email: 'jane.volunteer@kfri.res.in',
    role: 'Field Volunteer',
    initials: 'JV',
    color: 'blue',
  },
  {
    name: 'Dr. K. S. Nair',
    email: 'dr.nair@kfri.res.in',
    role: 'Senior Admin',
    initials: 'KN',
    color: 'grape',
  },
];

export function SignIn() {
  const auth = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Automatically navigate home once authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      navigate('/', { viewTransition: true });
    }
  }, [auth.isAuthenticated, navigate]);

  // Handle email/password sign-in
  const handleEmailSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Invalid email or password.');
      } else {
        await auth.refetch();
        navigate('/', { viewTransition: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please verify the backend connection.');
    } finally {
      setLoading(false);
    }
  };

  // Handle new user registration
  const handleSignUp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Could not complete registration.');
      } else {
        await auth.refetch();
        navigate('/', { viewTransition: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Quick Login
  const handleQuickLogin = async (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('Password123!');
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: accountEmail,
        password: 'Password123!',
      });

      if (res.error) {
        setErrorMessage(res.error.message || 'Could not sign in with demo account.');
      } else {
        await auth.refetch();
        navigate('/', { viewTransition: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Social OAuth Login (GitHub / Google)
  const handleSocialLogin = async (provider: 'github' | 'google') => {
    setErrorMessage(null);
    try {
      const res = await authClient.signIn.social({
        provider,
        callbackURL: window.location.origin + (import.meta.env.BASE_URL || '/'),
      });

      if (res?.error) {
        const providerName = provider === 'google' ? 'Google' : 'GitHub';
        if (res.error.code === 'PROVIDER_NOT_FOUND' || (res.error as any).status === 404) {
          setErrorMessage(
            `${providerName} sign-in is not configured yet. Please add ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET to lookaround_backend/.env to activate ${providerName} login.`
          );
        } else {
          setErrorMessage(res.error.message || `Failed to initiate ${providerName} sign-in.`);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to initiate ${provider} login.`);
    }
  };

  return (
    <Background className={classes.container}>
      <div className={classes.authModal}>
        {/* Left Hero Panel (Desktop) */}
        <div
          className={classes.heroPanel}
          style={{ backgroundImage: `url(${splash})` }}
        >
          <div className={classes.heroOverlay} />
          <div className={classes.heroContent}>
            <Stack gap='xs'>
              <Group gap='sm'>
                <Logo size={42} />
                <Title order={2} c='white' fw={700}>
                  LookAround
                </Title>
              </Group>
              <Badge color='rust' variant='filled' size='sm' radius='sm' style={{ width: 'fit-content' }}>
                Citizen Science Platform
              </Badge>
            </Stack>

            <Stack gap='lg' my='xl'>
              <div className={classes.heroFeatureItem}>
                <div className={classes.heroIconBadge}>
                  <IconLeaf size='1.1rem' color='#69db7c' />
                </div>
                <div>
                  <Text fw={600} size='sm' c='white'>
                    Field Survey Collection
                  </Text>
                  <Text size='xs' c='dimmed'>
                    Record flora and fauna sightings offline or live in remote conservation reserves.
                  </Text>
                </div>
              </div>

              <div className={classes.heroFeatureItem}>
                <div className={classes.heroIconBadge}>
                  <IconDatabase size='1.1rem' color='#4dabf7' />
                </div>
                <div>
                  <Text fw={600} size='sm' c='white'>
                    BioCollect Data Sync
                  </Text>
                  <Text size='xs' c='dimmed'>
                    Seamlessly push observations to institutional research repositories.
                  </Text>
                </div>
              </div>

              <div className={classes.heroFeatureItem}>
                <div className={classes.heroIconBadge}>
                  <IconShieldCheck size='1.1rem' color='#ffd43b' />
                </div>
                <div>
                  <Text fw={600} size='sm' c='white'>
                    Secure Open-Source Auth
                  </Text>
                  <Text size='xs' c='dimmed'>
                    Enterprise-grade session tokens, encrypted cookies, and role-based access.
                  </Text>
                </div>
              </div>
            </Stack>

            <Text size='xs' c='dimmed'>
              Kerala Forest Research Institute & ALA BioCollect
            </Text>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className={classes.formPanel}>
          <Stack gap='md'>
            <Box>
              <Group justify='space-between' align='center' mb='xs'>
                <Group gap='xs'>
                  <Logo size={32} />
                  <Title order={3} ff='heading'>
                    {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
                  </Title>
                </Group>
                <AssistButtons />
              </Group>
              <Text size='sm' c='dimmed'>
                {mode === 'signin'
                  ? 'Sign in to access your projects, surveys, and biodiversity records.'
                  : 'Register a new researcher or volunteer account to start collecting data.'}
              </Text>
            </Box>

            <SegmentedControl
              value={mode}
              onChange={(val) => {
                setMode(val as 'signin' | 'signup');
                setErrorMessage(null);
              }}
              data={[
                { label: 'Sign In', value: 'signin' },
                { label: 'Create Account', value: 'signup' },
              ]}
              fullWidth
              radius='md'
            />

            {errorMessage && (
              <Alert
                icon={<IconAlertCircle size='1rem' />}
                color='red'
                radius='md'
                variant='light'
                withCloseButton
                onClose={() => setErrorMessage(null)}
              >
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={mode === 'signin' ? handleEmailSignIn : handleSignUp}>
              <Stack gap='sm'>
                {mode === 'signup' && (
                  <TextInput
                    required
                    label='Full Name'
                    placeholder='e.g. Dr. Alex Citizen'
                    leftSection={<IconUser size='1rem' />}
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    radius='md'
                  />
                )}

                <TextInput
                  required
                  type='email'
                  label='Email Address'
                  placeholder='researcher@domain.org'
                  leftSection={<IconMail size='1rem' />}
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  radius='md'
                />

                <PasswordInput
                  required
                  label='Password'
                  placeholder='••••••••'
                  leftSection={<IconLock size='1rem' />}
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  radius='md'
                />

                <Button
                  type='submit'
                  color='rust'
                  fullWidth
                  mt='xs'
                  radius='md'
                  size='md'
                  loading={loading || auth.isLoading}
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </Stack>
            </form>

            <Divider label='or continue with' labelPosition='center' my={4} />

            <Group grow gap='sm'>
              <Button
                variant='default'
                radius='md'
                leftSection={<IconBrandGoogle size='1.1rem' />}
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
              >
                Google
              </Button>
              <Button
                variant='default'
                radius='md'
                leftSection={<IconBrandGithub size='1.1rem' />}
                onClick={() => handleSocialLogin('github')}
                disabled={loading}
              >
                GitHub
              </Button>
            </Group>

            {/* Quick Demo Access Grid */}
            <Stack gap={6} mt='xs'>
              <Text size='xs' c='dimmed' fw={600} tt='uppercase'>
                1-Click Demo Logins
              </Text>
              <div className={classes.demoGrid}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <Tooltip key={acc.email} label={`Sign in as ${acc.name} (${acc.email})`}>
                    <div
                      className={classes.demoCard}
                      onClick={() => handleQuickLogin(acc.email)}
                    >
                      <Group gap='xs' wrap='nowrap'>
                        <Avatar color={acc.color} radius='xl' size='sm'>
                          {acc.initials}
                        </Avatar>
                        <Box style={{ overflow: 'hidden' }}>
                          <Text size='xs' fw={600} truncate>
                            {acc.name}
                          </Text>
                          <Text size='10px' c='dimmed' truncate>
                            {acc.role}
                          </Text>
                        </Box>
                      </Group>
                    </div>
                  </Tooltip>
                ))}
              </div>
            </Stack>
          </Stack>
        </div>
      </div>
    </Background>
  );
}
