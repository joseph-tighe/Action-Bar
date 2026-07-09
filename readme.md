# Action Bar

This is a simple windows desktop app that lets you quickly run actions and search for things.

<img width="1303" height="896" alt="Screenshot 2026-07-03 223800" src="https://github.com/user-attachments/assets/ff7f19d6-6e2e-45eb-b719-db953184ddab" />

## Try it out
Download the latest release from the [releases](https://github.com/joseph-tighe/action-bar/releases) page.
## How to use it
To open the application run the setup.exe file. Windows may flag it as unsafe, if it does click advanced and then run. Then once the application is downloaded run the .exe file. In order to open the UI press `Alt + Z`.

In order to edit settings type `@settings` in the search bar and press enter.

To call a specific extension type `@ + The extension name` and press enter.
## Features
- Quickly open apps and files
- Use any extension
- Pipe extensions together
- Fully customizable

### Extensions
Extensions are pieces of JS anyone can write and download to add functionality to the app like google chrome extensions.

The user can call a specific extension by typing `@extension_name parameters`

If you want to make your own extension for the app see [extensions.md](https://github.com/joseph-tighe/Action-Bar/blob/master/src/extentions/extentionDocs.md)

### Pipelines
Pipelines are a bit confusing but the user has access to a JSON file and they can write pipelines in it. They allow for the user to pipe extensions together without code. For example if I have a hash file extension I can take the output of the **open** extension into the hash extension and output that to the user. Pipelines have more functionality than that they can combine pieces of text, run bash, access the user's clipboard and more. If you are interested in them read [pipelines.md](https://github.com/joseph-tighe/Action-Bar/blob/master/src/pipelines/pipelines.md)

## Build
If you want to build it you can it is not necessary to use it there is a release for that.
### Expected prerequisites
- Node JS
- npm
### Steps
> $git clone https://github.com/joseph-tighe/Action-Bar.git
> 
> $cd Action-Bar
> 
> $npm install
> 
> $npm run build-test

### Credit
all SVG icons are from the VS Code Extension [get-svg-icons](https://marketplace.visualstudio.com/items?itemName=marcochan.get-svg-icons) by Marco Chan

Except for the wikipedia logotype which is from [svg-repo](https://www.svgrepo.com/svg/57073/wikipedia)

