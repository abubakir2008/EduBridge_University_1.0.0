import type { Post, PostListItem, Category } from '@/types'

// Серверная выборка статей напрямую с бэкенда (для SSR/SSG публичного блога).
const API = process.env.INTERNAL_API_URL || 'http://localhost:8000'

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/api/categories`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    return (await res.json()) as Category[]
  } catch {
    return []
  }
}

export async function fetchPublishedPosts(category?: string): Promise<PostListItem[]> {
  try {
    const url = new URL(`${API}/api/posts`)
    if (category) url.searchParams.set('category', category)
    const res = await fetch(url.toString(), { next: { revalidate: 300 } })
    if (!res.ok) return []
    return (await res.json()) as PostListItem[]
  } catch {
    return []
  }
}

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API}/api/posts/${encodeURIComponent(slug)}`, { next: { revalidate: 300 } })
    if (!res.ok) return null
    return (await res.json()) as Post
  } catch {
    return null
  }
}
