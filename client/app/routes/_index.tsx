/**
 * Home Route - Landing page
 */

import type { MetaFunction } from 'react-router';
import { Container, Title, Text, Button, Card, Group, Stack } from '@mantine/core';
import { useTranslation, useTheme } from '~/hooks';

/**
 * Meta tags for home page
 */
export const meta: MetaFunction = () => [
  { title: 'Home - WebApp' },
  { name: 'description', content: 'Welcome to WebApp - A modern web application' },
];

/**
 * Home page component
 */
export default function Index() {
  const { t, language, setLanguage } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Container size="lg" className="py-xl">
      <Stack gap="xl">
        {/* Header */}
        <div className="text-center">
          <Title order={1} className="text-4xl font-bold mb-md">
            {t('common.welcome')}
          </Title>
          <Text size="lg" c="dimmed">
            {t('common.app_name')} - Modern Web Application
          </Text>
        </div>

        {/* Feature Cards */}
        <div className="grid-auto">
          <Card shadow="md" padding="lg" radius="md">
            <Title order={3} className="mb-sm">
              🎨 Design System
            </Title>
            <Text size="sm" c="dimmed">
              Centralized design tokens with Mantine and Tailwind CSS
            </Text>
          </Card>

          <Card shadow="md" padding="lg" radius="md">
            <Title order={3} className="mb-sm">
              🌍 i18n Support
            </Title>
            <Text size="sm" c="dimmed">
              Multi-language support with 4 languages out of the box
            </Text>
          </Card>

          <Card shadow="md" padding="lg" radius="md">
            <Title order={3} className="mb-sm">
              🌓 Dark Mode
            </Title>
            <Text size="sm" c="dimmed">
              Automatic theme switching with system preference detection
            </Text>
          </Card>

          <Card shadow="md" padding="lg" radius="md">
            <Title order={3} className="mb-sm">
              ⚡ Performance
            </Title>
            <Text size="sm" c="dimmed">
              Server-side rendering with Remix for optimal performance
            </Text>
          </Card>
        </div>

        {/* Controls */}
        <Card shadow="lg" padding="xl" radius="md" className="bg-surface">
          <Title order={3} className="mb-lg text-center">
            Try the Features
          </Title>

          <Stack gap="md">
            {/* Theme Toggle */}
            <Group justify="space-between">
              <div>
                <Text fw={500}>Theme</Text>
                <Text size="sm" c="dimmed">
                  Current: {isDarkMode ? 'Dark' : 'Light'}
                </Text>
              </div>
              <Button onClick={toggleTheme} variant="outline">
                {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
              </Button>
            </Group>

            {/* Language Selector */}
            <Group justify="space-between">
              <div>
                <Text fw={500}>Language</Text>
                <Text size="sm" c="dimmed">
                  Current: {language.toUpperCase()}
                </Text>
              </div>
              <Group gap="xs">
                <Button
                  size="sm"
                  variant={language === 'en' ? 'filled' : 'outline'}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </Button>
                <Button
                  size="sm"
                  variant={language === 'bn' ? 'filled' : 'outline'}
                  onClick={() => setLanguage('bn')}
                >
                  BN
                </Button>
                <Button
                  size="sm"
                  variant={language === 'de' ? 'filled' : 'outline'}
                  onClick={() => setLanguage('de')}
                >
                  DE
                </Button>
              </Group>
            </Group>
          </Stack>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Text className="mb-md">
            {t('common.hello', { name: 'Developer' })}
          </Text>
          <Button size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            {t('common.button_create')}
          </Button>
        </div>
      </Stack>
    </Container>
  );
}
