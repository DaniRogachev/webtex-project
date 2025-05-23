# Object defined queries

Prisma uses objects to define its queries which provides storng type safety but could lead to more complex and nested objects.

## Examples

### Query wrappers

- You can strongly define the query that is going to be executed
- You have the freedom of not defining the querry object
- You can pass the query object and build it gradually. 
- There are no interpolated strings

```ts
type SpecificUserQuery = {
  where: {
    age: { gte: number };
    email: { endsWith: string };
  };
}

type UserSummary = {
  id: number;
  name: string;
  email: string;
};

async function usersWithWhere(whereQuery: SpecificUserQuery): Promise<UserSummary[]> {
    return await prisma.user.findMany({
        ...whereQuery,
        select: {
            id: true,
            name: true,
            email: true
        }
    });
}


async function filterUsersKnex(knex: Knex, params: FilterParams) {
  let query = knex('users');

  if (params.age) {
    query = query.where('age', params.age);
  }

  if (params.nameContains) {
    query = query.where('name', 'like', `%${params.nameContains}%`);
  }

  return await query.select();
}
```

### Heavily nested objects
```ts
{
    where: {
        AND: [
            { name: { contains: "John" } },
            {
            posts: {
                some: {
                published: true,
                },
            },
            },
        ],
    }
}
```

### Raw queries
```ts
async function getPublishedPostsWithAuthors(limit: number, offset: number): Promise<PostWithAuthor[]> {
  const result = await prisma.$queryRaw<PostWithAuthor[]>`
    SELECT 
      ROW_NUMBER() OVER (ORDER BY "Post"."createdAt" DESC) AS row_number,
      "Post"."id",
      "Post"."title",
      "Post"."createdAt" AS created_at,
      "User"."name" AS author_name
    FROM "Post"
    JOIN "User" ON "Post"."userId" = "User"."id"
    WHERE "Post"."published" = true
    ORDER BY "Post"."createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return result;
}
```
