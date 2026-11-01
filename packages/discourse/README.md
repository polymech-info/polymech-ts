# Discourse library and CLI for OSR content

## Commands

### `info`

#### Print configuration and commands

```
osr-discourse info
```

### `deploy`

Create/Update post from directory, using OSR-Specs

**usage**

```sh

osr-discourse deploy --src="./*" 

```

### `sync <file>`

Sync file

**usage**

```sh

osr-discourse sync <file> 

    --src="<filepath.HTML|MD|OSR / glob / pipe>" 
    --cat=<category id> 
    --owner="user_name|user_id" 
    --config=<OSR Config Hash> 
    --timestamp=<default=now>
    --download-assets=true|false
    --tags=<tag ids | tag names>
    
```

### `sync-kb`

Create/Update/Sync kb from directory

**usage**

```sh

osr-discourse sync --src="./*" 

```

### `list`

List posts per category or search query

**usage**

```sh

osr-discourse list --query="discourse-query"  --dst="output.[json|xls|csv]" --fields="[post-fields]"

```

### `oa-user-import`

Imports oa-users from dump file

**usage**

```sh

osr-discourse oa-user --src="raw.json"

```

### `ig-user-sync`

Imports IG users from dump file

**usage**

```sh

osr-discourse ig-user sync --src="raw.json"

```

### `osr-commons-sync`

Sync all osr-commons ( taxonomy )

**usage**

```sh

osr-discourse osr-sync --src="path to commons (JSON)"

```

### `pm`

Notify all users, using Discourse private message

**usage**

```sh

osr-discourse pm --src="path to message (MD|HTML)" --groups="osr groups"

```

### `invite`

Send invite to a list of users, common MC/OSR CSV format

**usage**

```sh

osr-discourse invite --src="path to message (MD|HTML)" --src="path to CSV"

```

## Library / API

## References

- [ts-json-schema-generator - issue - functions](https://github.com/loopingz/webda.io/blob/main/packages/shell/src/code/compiler.ts#L154-243)

### Todos

////////////////////////
        //
        //  1. Fetch Tags
        //  2. Populate Tags
        //  3. Download (oa-bot)
        //  4. Sync - Assets (osr-machines)
        //  5. Ensure/Find user
        //
        //  Content
        //  
        //  Body (descr full)
        //  each step
        //  footer (refs)
        //  set tags
        //  set ts
        //
        //  Post
        //      -> sync lib
        //      -> translate -> lib
        //      -> digest
        //      -> notifications
        //      -> index
        //      -> update ext refs
        //          -> market place
        //      -> sync externals (git, ...)
