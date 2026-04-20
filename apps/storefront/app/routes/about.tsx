/**
 * About Route - Information about the platform
 * (Previously the Landing page content)
 */

import type { MetaFunction } from 'react-router';
import { Container, Title, Text, Button, Card, Stack } from '@mantine/core';
import { useTranslation } from '~/hooks/useTranslation';

/**
 * Meta tags for about page
 */
export const meta: MetaFunction = () => [
  { title: 'About - WebApp Store' },
  { name: 'description', content: 'Learn more about WebApp Store - A modern web application' },
];

/**
 * About page component
 */
export default function About() {
  const { t } = useTranslation();

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
              Multi-language support with 3 languages out of the box
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
              Server-side rendering with React Router for optimal performance
            </Text>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Text className="mb-md">
            Welcome to our modern web application platform.
          </Text>
          <Button size="lg" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            Learn More
          </Button>
        </div>
      </Stack>
    </Container>
  );
}
