# Gator CLI

Gator is a command-line RSS feed aggregator built with **Node.js, TypeScript, and PostgreSQL**.
It allows users to register, follow RSS feeds, automatically scrape posts, and browse them directly from the terminal.

The goal of this project is to fetch posts from RSS feeds and store them in a database so they can be easily viewed using a CLI.

---

# Features

* User registration and login
* Add RSS feeds
* Follow and unfollow feeds
* Automatically scrape feeds for new posts
* Store posts in a PostgreSQL database
* Browse recent posts from feeds you follow
* CLI-based workflow

---

# Requirements

Before running the program, you need:

* Node.js
* PostgreSQL
* npm

---

# Installation

Clone the repository:

```
git clone https://github.com/ameendababat/gator.git
cd gator
```

Install dependencies:

```
npm install
```

---

# Database Setup

Create a PostgreSQL database:

```
createdb gator
```

Run database migrations:

```
npx drizzle-kit migrate
```

---

# Configuration

Gator uses a config file stored in your home directory.

Create the file:

```
~/.gatorconfig.json
```

Example config:

```
{
  "db_url": "postgres://username:password@localhost:5432/gator",
  "currentUserName": ""
}
```

Explanation:

* **db_url** – PostgreSQL connection string
* **currentUserName** – the user currently logged in

---

# Running the CLI

Start the CLI with:

```
npm run start <command>
```

Example:

```
npm run start register ameen
```

---

# Commands

## Register a user

```
npm run start register <username>
```

Creates a new user and logs them in.

---

## Login

```
npm run start login <username>
```

Switches the current user.

---

## List users

```
npm run start users
```

Shows all users and highlights the current one.

---

## Add a feed

```
npm run start addfeed <name> <url>
```

Example:

```
npm run start addfeed tech https://techcrunch.com/feed/
```

Adds a feed and automatically follows it.

---

## List feeds

```
npm run start feeds
```

Shows all feeds stored in the database.

---

## Follow a feed

```
npm run start follow <url>
```

Follows an existing feed.

---

## Unfollow a feed

```
npm run start unfollow <url>
```

Stops following a feed.

---

## View followed feeds

```
npm run start following
```

Lists feeds the current user follows.

---

## Start the feed aggregator

```
npm run start agg <time>
```

Example:

```
npm run start agg 30s
```

This command continuously fetches RSS feeds and stores new posts in the database.

Supported time formats:

* `10ms`
* `5s`
* `1m`
* `1h`

Press **Ctrl + C** to stop the aggregator.

---

## Browse posts

```
npm run start browse
```

Shows the most recent posts from feeds you follow.

Optional limit:

```
npm run start browse 10
```

---

# Example RSS Feeds

You can test the program with these feeds:

TechCrunch
https://techcrunch.com/feed/

Hacker News
https://news.ycombinator.com/rss

Boot.dev Blog
https://www.boot.dev/blog/index.xml

---

# Tech Stack

* Node.js
* TypeScript
* PostgreSQL
* Drizzle ORM
* fast-xml-parser

---

# Project Structure

```
src
 ├── index.ts
 ├── config.ts
 ├── lib
 │   ├── scraper.ts
 │   ├── rss.ts
 │   └── db
 │       ├── schema.ts
 │       └── queries
```

---

# Author

Ameen Dababat
Computer Engineering / Programmer
