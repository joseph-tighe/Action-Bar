# Extension Documentation
To make an extension you will need to make a github repository that should follow this format:

```
Root (Github repo)
├── manifest.json
└── main.js
```

## manifest.json
This is the manifest file that tells the app what extension is and what it does.
Example:
```json
{
  "name": "My_extension",
  "file": "main.js",
  "settings": {
    "active": true
  },
  "RunFunction": "My_extension_Run",
  "CheckFunction": null,
  "copyFunction": null
}
```
### Name:
The name the user will call for your extension for example`@My_extension` spaces are not allowed.
### File:
The file that contains your code.
### Settings:
> ### active:
 > Whether or not the extension is currently active.
### RunFunction:
In your code you will include a function that will be called when the user queries your extension. This function will be called with the following parameters:
- key: the key that was last pressed by the user
- output: an object that will be used to output text to the user
- search: an object that will be used to get the user's query
In your manifest file you will specify the name of the function that will be called.
### CheckFunction:
This property can be null, having it as null is the default value.
If the value is null the extension will only be called when the user queries it.
If the value is a function name the extension will call it every time the search bar changes. This function will return a boolean. If it returns true the extension will be called.
CheckFunction takes one parameter: `search` — a Search object used to get the user's query. Use `search.getQuery()` to access the current search text.
### copyFunction:
The copy functions can be null, having it as null is the default value.
If the value is null when the user presses copy to clipboard the extensions output will be copied to the clipboard.
If a copy function is specified it will be called when the user presses copy to clipboard. The function is not expected to return anything. It is expected that the function will copy the extensions output to the clipboard, using `navigator.clipboard.writeText(text)`. The function will be passed one parameter, the text value of the extension output.

## Important classes
### Search
The Search class is used to get the user's query.
Search has the following methods:
- getFullText(): returns the full text of the query
- getPrefix(): returns the prefix of the query
- getQuery(): returns the query
- setText(text): sets the text of the query
- isRelevant(): returns true if the query is relevant

### Answer
The Answer class is used to output text to the user.
Answer has the following methods:
- updateText(text): updates the text of the answer
- updateImage(imageUrl): updates the image of the answer
- getText(): returns the text of the answer
- getImageUrl(): returns the imageUrl of the answer
- getWrapper(): returns the wrapper of the answer
- destroy(): destroys the answer
- removeIcon(): removes the icon from the answer
- addIcon(): adds the icon to the answer

### PipelineSearch
The PipelineSearch mimics the properties of the Search class, but is used when your extension is called as a pipeline, you probably won't need to change a thing to use it.

PipelineSearch has the following methods:
- getFullText(): returns the full text of the query
- getPrefix(): returns the prefix of the query
- getQuery(): returns the query
- setText(text): sets the text of the query
- isRelevant(): returns true if the query is relevant

### PipelineAnswer
The PipelineAnswer mimics the properties of the Answer class, but is used when your extension is called as a pipeline, you probably won't need to change a thing to use it.

PipelineAnswer has the following methods:
- updateText(text): updates the text of the answer
- updateImage(imageUrl): updates the image of the answer
- getText(): returns the text of the answer
- getImageUrl(): returns the imageUrl of the answer
- getWrapper(): returns the wrapper of the answer
- destroy(): destroys the answer
- removeIcon(): removes the icon from the answer
- addIcon(): adds the icon to the answer

## Examples
### Run function
```js
function RunFunction(key, output, search) {
  output.updateImage("extensions/My_extension/myextension.svg");
  if (search.isRelevant()) {
    output.updateText("Hello World");
  } else {
    output.destroy();
  }
}
```

### Check function
```js
function CheckFunction(search) {
  const query = search.getQuery();
  if (query.includes("hello")) {
    return true;
  }
  return false;
}
```

### Copy function
```js
function copyFunction(text) {
    //This is the default copy function
    navigator.clipboard.writeText(text);
}
```

## Publishing your repository
Create a new repository on github and make sure it is public.
The root of your project should be the name of your repository.

## Downloading your extension
- A user will need to type `@settings` in the search bar and press enter.
- Then they press **Download extension** from the sidebar.
- Then just type `Github-Username/Repository-Name` and press enter.
- Then upon restarting the app the extension will be downloaded.

If you want your extension to be one of the listed options on the settings page just make a github issue and I'll look into it.
