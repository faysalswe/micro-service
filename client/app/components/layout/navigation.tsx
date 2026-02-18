/**
 * Navigation Component
 * Main navigation bar with auth-aware links
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Group, Button, Text, Box, Menu, Avatar, Burger } from '@mantine/core';
import { useAuth } from '~/contexts/auth-context';
import { useTheme } from '~/hooks/useTheme';

/**
 * Navigation props
 */
interface NavigationProps {
  opened?: boolean;
  toggle?: () => void;
}

/**
 * Main navigation component
 */
export function Navigation({ opened, toggle }: NavigationProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Orders', href: '/orders', auth: true },
    { label: 'Payments', href: '/payments', auth: true },
    { label: 'Dashboard', href: '/dashboard', auth: true },
    { label: 'Profile', href: '/profile', auth: true },
  ];

  const filteredLinks = navLinks.filter(link => !link.auth || isAuthenticated);

  const handleToggle = toggle || (() => setMobileMenuOpen(!mobileMenuOpen));
  const isOpen = opened !== undefined ? opened : mobileMenuOpen;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and burger */}
          <div className="flex items-center gap-6">
            <Burger
              opened={isOpen}
              onClick={handleToggle}
              className="sm:hidden"
              size="sm"
            />
            <Text fw={700} size="lg" className="text-gray-800 dark:text-white">
              WebApp
            </Text>
            {/* Desktop navigation */}
            <nav className="hidden sm:flex items-center gap-4">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium no-underline ${
                    location.pathname === link.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Button
              variant="subtle"
              size="sm"
              onClick={toggleTheme}
              className="hidden sm:inline-flex"
            >
              {isDarkMode ? '☀️ Light' : '🌙 Dark'}
            </Button>

            {isAuthenticated ? (
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <Button variant="subtle" px="xs">
                    <Group gap="xs">
                      <Avatar size={28} color="blue" radius="xl">
                        {user?.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box className="hidden sm:block">
                        <Text size="sm" fw={500}>
                          {user?.username}
                        </Text>
                      </Box>
                    </Group>
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/profile">
                    Profile
                  </Menu.Item>
                  <Menu.Item component={Link} to="/dashboard">
                    Dashboard
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item color="red" onClick={logout}>
                    Logout
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            ) : (
              <Group gap="xs">
                <Button
                  component={Link}
                  to="/login"
                  variant="outline"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  component={Link}
                  to="/register"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  Sign Up
                </Button>
              </Group>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <nav className="flex flex-col gap-2">
              {filteredLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium no-underline ${
                    location.pathname === link.href
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={toggleTheme}
                  fullWidth
                  justify="start"
                >
                  {isDarkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode'}
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}