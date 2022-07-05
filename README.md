Taken from Web Dev Simplified tutorial

[Learn Prisma In 60 Minutes](https://www.youtube.com/watch?v=RebA5J-rlwg)

Initialize a new project in Node `npm init -y`

Install packages needed `npm i --save-dev prisma typescript ts-node @types/node nodemon`

Init Prisma `npx prisma init --datasource-provider postgresql` 

```sql
# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="postgresql://<postgres_username>:<your_password>@localhost:5432/test"
```

Create User modal and migrate db, need to have a db set up in pgAdmin.

```sql
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id   Int    @id @default(autoincrement())
  name String
}
```

`npx prisma migrate dev --name init`

Install Prisma client `npm i @prisma/client`

If you need to re-generate the Prisma client (it’ll do it on install) you can `npx prisma generate`

Now you can interact with the db through Prisma in .ts files

```tsx
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	// Creates 1 user.
  const user = await prisma.user.create({ data: { name: "Mat" } });
  console.log(user);

	// OR

	// Gets all users.
	const users = await prisma.user.findMany();
  console.log(users);
}

main()
  .catch((e) => {
    console.error(e.message);
  })
  .finally(async () => {
    await prisma.$disconnect;
  });
```

<aside>
💡 It’s important to only create one instance of the `const prisma = new PrismaClient()` import to not bog down your db

</aside>

```bash
➜  prisma-example git:(master) ✗ npm run devStart

> prisma-example@1.0.0 devStart
> nodemon script.ts

[nodemon] 2.0.19
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: ts,json
[nodemon] starting `ts-node script.ts`
{ id: 1, name: 'Mat' }
[nodemon] clean exit - waiting for changes before restart
[nodemon] restarting due to changes...
[nodemon] starting `ts-node script.ts`
{ id: 2, name: 'Kyle' }
[nodemon] clean exit - waiting for changes before restart
[nodemon] restarting due to changes...
[nodemon] starting `ts-node script.ts`
[ { id: 1, name: 'Mat' }, { id: 2, name: 'Kyle' } ]
[nodemon] clean exit - waiting for changes before restart
```

You can only have one `datasource` defined in your schema. Must have a provider and a URL. 

You can have multiple `generators` for your codebase. We’re using one for this example to use Prisma in our .js. 

Built out schema

```sql
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id               String          @id @default(uuid())
  age              Int
  name             String
  email            String          @unique
  role             Role            @default(BASIC)
  writtenPosts     Post[]          @relation("WrittenPosts")
  favoritePosts    Post[]          @relation("FavoritePosts")
  userPreference   UserPreference? @relation(fields: [userPreferenceId], references: [id])
  userPreferenceId String?         @unique

  @@unique([age, name])
  @@index([email])
}

model UserPreference {
  id           String  @id @default(uuid())
  emailUpdates Boolean
  user         User?
}

model Post {
  id            String     @id @default(uuid())
  title         String
  averageRating Float
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  author        User       @relation("WrittenPosts", fields: [authorId], references: [id])
  authorId      String
  favoritedBy   User?      @relation("FavoritePosts", fields: [favoritedById], references: [id])
  favoritedById String?
  categories    Category[]
}

model Category {
  id    String @id @default(uuid())
  name  String @unique
  posts Post[]
}

enum Role {
  BASIC
  ADMIN
}
```

Create a User with optional UserPreference and return the values from the **related** `userPreference` with `include`

```tsx
const user = await prisma.user.create({
  data: {
    name: "Mat",
    email: "mat@test.com",
    age: 32,
    userPreference: {
      create: {
        emailUpdates: true,
      },
    },
  },
  include: {
    userPreference: true,
  },
});

// Creates:
{
  id: '691711d2-1539-496a-89ad-0025e57e223f',
  age: 32,
  name: 'Mat',
  email: 'mat@test.com',
  role: 'BASIC',
  userPreferenceId: '10a38ddf-6c3c-43ca-ad50-e6ec9b09f88f',
  userPreference: { id: '10a38ddf-6c3c-43ca-ad50-e6ec9b09f88f', emailUpdates: true }
}
```

You can also use `select` to return **specific** values after creation

```tsx
const user = await prisma.user.create({
  data: {
    name: "Mat",
    email: "mat@test.com",
    age: 32,
    userPreference: {
      create: {
        emailUpdates: true,
      },
    },
  },
  select: {
    name: true,
    userPreference: { select: { id: true } },
  },
});

// Returns
{
  name: 'Mat',
  userPreference: { id: '631dab3a-8214-40bd-9b03-ac0d00753698' }
}
```

`createMany` example

```tsx
const users = await prisma.user.createMany({
  data: [
    {
      name: "Mat",
      email: "mat@test.com",
      age: 32,
    },
    {
      name: "Kyle",
      email: "kyle@test.com",
      age: 27,
    },
  ],
});
```

<aside>
💡 You can’t use `include` or `select` here

</aside>

`findUnique` **only** searches on unique fields

```tsx
// Always returns 1
const user = await prisma.user.findUnique({
  where: {
    email: "mat@test.com",
  },
});

// Match on unique key
const user = await prisma.user.findUnique({
  where: {
    age_name: {
      age: 32,
      name: "Mat",
    },
  },
});
```

`findFirst` searchs and returns first found

```tsx
const user = await prisma.user.findFirst({
  where: {
    name: "Mat",
    AND: {
      age: 32,
    },
  },
});

// Can do things like AND / NOT / OR
```

`findMany` is same as `findFirst` but returns an array of matches.

`distinct` returns Sally with distinct name and age

```tsx
const user = await prisma.user.findFirst({
  where: {
    name: "Sally",
  },
  distinct: ["name", "age"],
});
```

`take` returns the first 2 Sally results // `skip` skips the first one (offset) // `orderBy`

```tsx
const user = await prisma.user.findFirst({
  where: {
    name: "Sally",
  },
	orderBy: {
    age: "asc",
  },
  take: 2,
	skip: 1,
});
```

`where` clauses

```tsx
// equals
where: {
  name: { equals: "Sally" },
},

// startsWith / endsWith
where: {
  name: { startsWith: "Sally" },
},

// not
where: {
  name: { not: "Sally" },
},

// in
where: {
  name: { in: ["Sally", "Mat"] },
},

// lt - less than lte - less than equal to
where: {
  name: { in: ["Sally", "Mat"] },
  age: { lt: 20 },
},
orderBy: { age: "desc" },

// contains
where: {
  email: { contains: "@test.com" },
},

// AND / OR / NOT
where: {
  AND: [
    { email: { contains: "@test.com" } },
    { email: { startsWith: "sally" } },
  ],
},

where: {
  OR: [
    { email: { contains: "@test.com" } },
    { email: { startsWith: "sally" } },
  ],
},

// Relationships - every / none / some
where: {
  writtenPosts: {
    every: {
      createdAt: new Date(),
    },
  },
},

// is / isNot
const user = await prisma.post.findMany({
  where: {
    author: {
      is: {
        age: 32,
      },
    },
  },
});
```

`update` and `updateMany` updateMany updates the first user it finds, many updates all it finds. 

You can also `connect` to an existing relationship

```tsx
const user = await prisma.user.update({
  where: {
    email: "mat@test.com",
  },
  data: {
    userPreference: {
      connect: {
        id: "60b65e15-1727-4627-9b5f-8f2c24727603",
      },
    },
  },
});

// set to null using disconnect
const user = await prisma.user.update({
  where: {
    email: "mat@test.com",
  },
  data: {
    userPreference: {
      disconnect: true
    },
  },
});
```

`delete` and `deleteMany`

```tsx
const user = await prisma.user.delete({
  where: {
      email: "sally@test.com"
  }
});
```