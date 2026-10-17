import { categoriesInUse } from '../categoriesInUse'
import type { CatalogCategory } from '../../../types/backend/catalog'

const cat = (id: string): CatalogCategory => ({ id, name: id, slug: id, icon: null, imageUrl: null, imageBlurhash: null, sortOrder: 0 })

describe('categoriesInUse', () => {
  it('deja solo las categorías con al menos un producto, en su orden', () => {
    const result = categoriesInUse([cat('a'), cat('b'), cat('c')], [{ categoryId: 'c' }, { categoryId: 'a' }, { categoryId: 'a' }])
    expect(result.map((c) => c.id)).toEqual(['a', 'c'])
  })

  it('productos sin categoría no cuentan para ninguna', () => {
    expect(categoriesInUse([cat('a')], [{ categoryId: null }])).toEqual([])
  })

  it('sin productos (localidad vacía) no hay categorías', () => {
    expect(categoriesInUse([cat('a'), cat('b')], [])).toEqual([])
  })
})
