/**
 * ROUTE TEMPLATE
 * Copy this template when creating new routes
 *
 * Replace:
 * - RouteName with your route name
 * - Update loader/action logic
 * - Update component JSX
 *
 * Follow these rules:
 * - Export loader for data fetching
 * - Export action for mutations
 * - Export ErrorBoundary for error handling
 * - Export meta for SEO
 * - Keep under 200 lines (move logic to utils/services)
 * - Handle loading and error states
 */

import type { LoaderFunctionArgs, ActionFunctionArgs, MetaFunction } from 'react-router';
import { data as json, redirect } from 'react-router';
import { useLoaderData, useActionData, Form, useNavigation } from 'react-router';
import { Button, Container, Title, Text } from '@mantine/core';
import { useTranslation } from '~/hooks';
import { getThemeFromRequest, getLanguageFromRequest } from '~/utils/theme.server';
import { NotFoundError } from '~/utils/errors';

/**
 * Loader data type
 */
interface LoaderData {
  item: {
    id: string;
    name: string;
    description: string;
  };
  theme: string;
  language: string;
}

/**
 * Action data type
 */
interface ActionData {
  success?: boolean;
  error?: string;
  errors?: Record<string, string>;
}

/**
 * Meta tags for SEO
 */
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [{ title: '404 - Not Found' }];
  }

  return [
    { title: `${data.item.name} - WebApp` },
    { name: 'description', content: data.item.description },
  ];
};

/**
 * Loader function - Fetch data on server
 * @param {LoaderFunctionArgs} args - Loader arguments
 * @returns {Promise<Response>} JSON response with data
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  // Get theme and language from request
  const theme = getThemeFromRequest(request);
  const language = getLanguageFromRequest(request);

  // Fetch data (example)
  const itemId = params['id'];
  if (!itemId) {
    throw new NotFoundError('Item');
  }

  // Example API call (replace with actual service)
  const item = await fetchItem(itemId);

  if (!item) {
    throw new NotFoundError('Item');
  }

  return json<LoaderData>({
    item,
    theme,
    language,
  });
}

/**
 * Action function - Handle form submissions
 * @param {ActionFunctionArgs} args - Action arguments
 * @returns {Promise<Response>} JSON response or redirect
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'update') {
      const name = formData.get('name');
      const description = formData.get('description');

      // Validation
      const errors: Record<string, string> = {};
      if (!name || typeof name !== 'string') {
        errors['name'] = 'Name is required';
      }

      if (Object.keys(errors).length > 0) {
        return json<ActionData>({ errors }, { status: 400 });
      }

      // Update item (example)
      await updateItem(params['id'] ?? '', { name: String(name), description: String(description) });

      return redirect(`/items/${params['id'] ?? ''}`);
    }

    if (intent === 'delete') {
      await deleteItem(params['id'] ?? '');
      return redirect('/items');
    }

    return json<ActionData>({ error: 'Invalid intent' }, { status: 400 });
  } catch (error) {
    return json<ActionData>({ error: 'Something went wrong' }, { status: 500 });
  }
}

/**
 * Route component
 */
export default function RouteComponent() {
  const { t } = useTranslation();
  const { item } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <Container className="py-lg">
      <Title order={1} className="mb-md">
        {item.name}
      </Title>

      <Text className="mb-lg">{item.description}</Text>

      <Form method="post" className="flex flex-col gap-md">
        {/* Form fields here */}

        {actionData?.errors && (
          <div className="p-md bg-error rounded-md">
            {Object.entries(actionData.errors).map(([field, error]) => (
              <Text key={field} c="red">
                {error}
              </Text>
            ))}
          </div>
        )}

        <div className="flex gap-md">
          <Button type="submit" name="intent" value="update" loading={isSubmitting}>
            {t('common.button_save')}
          </Button>

          <Button
            type="submit"
            name="intent"
            value="delete"
            color="red"
            variant="outline"
            loading={isSubmitting}
          >
            {t('common.button_delete')}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

/**
 * Error boundary for handling route errors
 */
export function ErrorBoundary() {
  const { t } = useTranslation();

  return (
    <Container className="py-lg text-center">
      <Title order={1} className="mb-md">
        {t('errors.generic_title')}
      </Title>
      <Text className="mb-lg">{t('errors.generic_description')}</Text>
      <Button component="a" href="/">
        {t('errors.404_action')}
      </Button>
    </Container>
  );
}

// ========== EXAMPLE FUNCTIONS (Replace with actual services) ==========

async function fetchItem(id: string): Promise<LoaderData['item'] | null> {
  // Replace with actual API call
  return {
    id,
    name: 'Example Item',
    description: 'This is an example item',
  };
}

async function updateItem(
  _id: string,
  _data: { name: string; description: string }
): Promise<void> {
  // Replace with actual API call
  await Promise.resolve();
}

async function deleteItem(_id: string): Promise<void> {
  // Replace with actual API call
  await Promise.resolve();
}
