# Contributing

## How to build the addon from source

* Clone this repository: `git clone git@bitbucket.org:pabuisson/in-my-pocket.git`
* `cd` to the directory where you cloned the repository,
* `$ npm install`: install the tools needed to build the addon from the source files. You'll need to have `npm` installed on your computer. For more information about this, see [npmjs.com - Get npm](https://www.npmjs.com/get-npm),
* `$ npm run build`: launch webpack and store all the final files into `./build`. In there, you'll find a `firefox/` directory which can be loaded in Firefox through the `about:debugging` page for development purpose, and a `chrome/` directory, which can be loaded into chrome through the `chrome://extensions` page,
* `$ npm run watch`: launch webpack in watch mode, building the concatenated files into `./build ` and updating the build directory everytime you modify the source files. See above for details about the generated `build/` directory,
* `$ npm run package` : compiles the source files and build the addon "zip" files, ready for submission to the browser stores :) This task triggers two different subtasks, `$ npm run package-ff` and `$ npm run package-chrome` that rely on different `manifest.json` files,
* `$ npm run test`: runs the tests associated to this project.


## Linter

If you want to, `eslint` is configured and can help you in the development process. You'll need to set it up with `npm install -g eslint` and then setup your text editor of choice so that it's able to display the linter warnings.

`prettier` is also configured, you can run it to have your JS code correctly formatted. There is no git hook yet to enforce it, but it will happen someday soon.


## Workflow

Before submitting a pull request, please always make sure that it starts from the latest `origin/master` available (if you've fetched the project long ago, you might not have the latest version). If it's not the case, please do not forget to rebase your branch on `origin/master` first (you'll need to merge `origin/master` in your own `master` branch).

-----

## Thanks

Thanks for everyone who contributed to this project in one way or another, be that by sending financial contributions to encourage the development, submitting pull requests or code suggestions, helping with debug, offering suggestions and ideas, taking time to write a review on addons.mozilla.org, or simply by using the addon. As a fellow Pocket user, I'm glad that this addon is useful to the community, and I thank you all for your contributions to this project :)

Special thanks to the developers who helped me and contributed to the project:

* [adambro](https://bitbucket.org/adambro/)
* [eight04](https://bitbucket.org/eight04/)
* [bobi32](https://bitbucket.org/bobi32/)
* [kEINnAMER](https://bitbucket.org/kEINnAMER/)
* [JJ](https://bitbucket.org/jjzakius/)
* [danielrozenberg](https://github.com/danielrozenberg)