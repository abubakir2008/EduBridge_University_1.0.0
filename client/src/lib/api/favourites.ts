import client from './client'
import type { University } from '@/types'

export const apiGetFavourites = () =>
  client.get<University[]>('/favourites').then((r) => r.data)

export const apiAddFavourite = (universityId: string) =>
  client.post(`/favourites/${universityId}`).then((r) => r.data)

export const apiRemoveFavourite = (universityId: string) =>
  client.delete(`/favourites/${universityId}`)

export const apiCompareFavourites = (ids: string[]) =>
  client.get<University[]>('/favourites/compare', { params: { ids: ids.join(',') } }).then((r) => r.data)
