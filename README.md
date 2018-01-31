# firefox-pocket

For all those who are missing the old Pocket addon for Firefox, here's an unofficial client for the [Pocket](http://getpocket.com/) webservice. I'm not in any way affiliated to Pocket and only does this for my fellow Firefox users looking for an easy to use Pocket extension for their favorite browser.

If you have suggestions on how to improve this extension or encounter some bugs, do not hesitate to contact me on Twitter [@pabuisson](https://twitter.com/pabuisson). And of course, if you like this extension, do not forget to leave a comment on [Mozilla addons](https://addons.mozilla.org/), it will be greatly appreciated!


## Build the addon from source

* Clone this repository
* `cd` to the directory where you clone the repository,
* `$ npm install` : install the tools needed to build the addon from the source files. You'll need to have `npm` installed on your computer. For more information about this, see [npmjs.com - Get npm](https://www.npmjs.com/get-npm),
* `$ npm run build` : launch webpack and store all the final files into `./build`, which can be loaded through the `about:debugging` page for development purpose,
* `$ npm run watch` : launch webpack in watch mode, building the concatenated files into './build' everytime you modify the source files, which can be loaded through the `about:debugging` page for development purpose,
* `$ npm run build-ext` : compile the source files and build the addon "zip" file, ready for submission :)

If you want to, `eslint` is configured and can help you in the development process. You need to set it up with `npm install -g eslint` and then setup your text editor of choice so that it's able to display the linter warnings.


## Contribute

Before submitting a pull request, please always make sure that it starts from the latest `origin/master` available (if you've fetched the project long ago, you might not have the latest version). If it's not the case, please do not forget to rebase your branch on `origin/master` first (you'll need to merge `origin/master` in your own `master` branch).


## Thanks

Thanks for everyone who contributed to this project, be that by sending pull requests, help with debugging, offering suggestions and idea, or simply by using it. As a fellow Pocket user, I'm glad that this addon is useful to you, and I thank you all for your contribution to this project :)

Special thanks to the developers who helped me and contributed to the project:

* [adambro](https://bitbucket.org/adambro/)
* [eight04](https://bitbucket.org/eight04/)
* [bobi32](https://bitbucket.org/bobi32/)
* [kEINnAMER](https://bitbucket.org/kEINnAMER/)
