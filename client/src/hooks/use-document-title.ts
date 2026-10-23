import { useEffect } from 'react';

import { siteConfig } from '@/config/site';

export function useDocumentTitle(title: string | undefined): void {
  useEffect(() => {
    document.title = title ? `${title} · ${siteConfig.name}` : siteConfig.name;
  }, [title]);
}
