// ExternalLink component for opening URLs in the browser.
// Used for clickable links in the UI.

import { Href, Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { type ComponentProps } from 'react';
import { Platform } from 'react-native';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * ExternalLink
 * Renders a link that opens the given URL in the system browser.
 * @param props.href - The URL to open
 * @param props.children - The link text or content
 */
export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      onPress={async (event) => {
        if (Platform.OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await WebBrowser.openBrowserAsync(href);
        }
      }}
    />
  );
}
