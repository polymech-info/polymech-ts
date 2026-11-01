# Tools Reference

## Email
send_email(recipient, ?subject, ?body): Send markdown emails

## Search
google(query): Search Google
serpapi(query, ?engine): Search for locations/places

## Filesystem
list_files(directory, ?pattern): List files in dir
read_files(directory, ?pattern): Read files in dir
remove_file(path): Delete file
rename_file(src, dst): Move/rename file
modify_project_files(files[]): Modify existing files
create_file(file): Create new file
file_exists(path): Check if file exists
read_file(path): Read file contents

## NPM
build_project(): Run pnpm build
run_npm(command, ?args[]): Run npm/pnpm commands
install_dependency(dependencies[]): Install packages

## Git
init_repository(): Initialize git repo
commit_files_git(files[], ?message): Commit files

## Terminal
execute_command(command, ?args[], ?cwd, ?background, ?window, ?detached): Run shell commands