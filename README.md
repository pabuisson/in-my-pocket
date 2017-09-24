# firefox-pocket

For all those who are missing the old Pocket addon for Firefox, here's an unofficial client for the [Pocket](http://getpocket.com/) webservice. I'm not in any way affiliated to Pocket and only does this for my fellow Firefox users looking for an easy to use Pocket extension for their favorite browser.

If you have suggestions on how to improve this extension or encounter some bugs, do not hesitate to contact me on Twitter [@pabuisson](https://twitter.com/pabuisson). And of course, if you like this extension, do not forget to leave a comment on [Mozilla addons](https://addons.mozilla.org/), it will be greatly appreciated!


## Build the addon from source

* Clone this repository
* `cd` to the directory where you clone the repository,
* `$ npm install` : this will install the tools needed to build the addon from the source files. You'll need to have `npm` installed on your computer. For more information about this, see [npmjs.com - Get npm](https://www.npmjs.com/get-npm),
* `$ npm run build` : this will launch webpack and store all the final files into `./build`, which can be loaded through the `addons:debugging` page for development purpose,
* `$ npm run watch` : this will launch webpack in watch mode, building the concatenated files into './build' everytime you modify the source files, which can be loaded through the `addons:debugging` page for development purpose,
* `$ npm run build-ext` : this will compile the source files and build the addon "zip" file, ready for submission :)


## Contribute

Before submitting a pull request, please always make sure that it starts from the latest `origin/master` available. If it's not the case, please do not forget to rebase your branch on `master` first.


## Thanks

Thanks for everyone who contributed to this project, be that by sending pull requests, help debugging, offering suggestions and idea, or simply by using it. As a fellow Pocket user, I'm glad that this addon is useful to you, and I thank you all for your contribution to this project :)
