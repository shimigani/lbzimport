import { useEffect } from 'react'

type SeoInput = {
  title: string
  description?: string | null
  image?: string | null
  canonical?: string | null
  noIndex?: boolean
  favicon?: string | null
}

function setMeta(name: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setProperty(property: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

export function useSeo({
  title,
  description,
  image,
  canonical,
  noIndex,
  favicon,
}: SeoInput) {
  useEffect(() => {
    document.title = title
    setProperty('og:title', title)
    setProperty('twitter:title', title)

    if (description) {
      setMeta('description', description)
      setProperty('og:description', description)
      setProperty('twitter:description', description)
    }

    if (image) {
      setProperty('og:image', image)
      setProperty('twitter:image', image)
    }

    if (canonical) {
      setLink('canonical', canonical)
      setProperty('og:url', canonical)
    }

    if (favicon) {
      setLink('icon', favicon)
    }

    if (noIndex) {
      setMeta('robots', 'noindex, nofollow')
    }
  }, [title, description, image, canonical, noIndex, favicon])
}