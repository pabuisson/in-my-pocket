# In My Pocket browser addon for Firefox

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1b66013669b94f77a574b39c305ef23b)](https://www.codacy.com/app/pabuisson/in-my-pocket?utm_source=pabuisson@bitbucket.org&amp;utm_medium=referral&amp;utm_content=pabuisson/in-my-pocket&amp;utm_campaign=Badge_Grade)
[![Mozilla Add-on](https://img.shields.io/amo/v/in-my-pocket.svg)](https://addons.mozilla.org/firefox/addon/in-my-pocket/)
[![](https://img.shields.io/amo/users/in-my-pocket.svg)](https://addons.mozilla.org/firefox/addon/in-my-pocket/statistics/usage/?last=365)
[![](https://img.shields.io/amo/rating/in-my-pocket.svg)](https://addons.mozilla.org/firefox/addon/in-my-pocket/reviews/)


This project is aimed to all people who are missing the old Pocket addon for Firefox. It is an unofficial browser addon for the [Pocket](http://getpocket.com/) webservice, for the moment targeting only Firefox > 45. I'm not in any way affiliated to Pocket and only does this for my fellow Firefox users looking for an easy to use Pocket extension for their favorite browser.

![In My Pocket 0.11.x logo](./assets/banner.png)

If you have suggestions on how to improve this extension or encounter some bugs, do not hesitate to contact me on Twitter [@pabuisson](https://twitter.com/pabuisson). And of course, if you like this extension, do not forget to leave a review on [Mozilla addons](https://addons.mozilla.org/en-US/firefox/addon/in-my-pocket/), it will be greatly appreciated!

## Useful links

* [In My Pocket homepage](https://inmypocketaddon.com), where you'll find a FAQ, the changelog and more info about the addon,
* [In My Pocket on addons.mozilla.org](https://addons.mozilla.org/en-US/firefox/addon/in-my-pocket/)
* [In My Pocket contact form](https://pabuisson.wufoo.com/forms/zi5scw41v368kr/)
* [In My Pocket public roadmap on Trello](https://trello.com/b/MfdNQXzX/imp-public-roadmap)

-----

## Contributing

### How to build the addon from source

* Clone this repository: `git clone git@bitbucket.org:pabuisson/in-my-pocket.git`
* `cd` to the directory where you cloned the repository,
* `$ npm install`: install the tools needed to build the addon from the source files. You'll need to have `npm` installed on your computer. For more information about this, see [npmjs.com - Get npm](https://www.npmjs.com/get-npm),
* `$ npm run build`: launch webpack and store all the final files into `./build`, which can be loaded in Firefox through the `about:debugging` page for development purpose,
* `$ npm run watch`: launch webpack in watch mode, building the concatenated files into './build' and updating the build directory everytime you modify the source files. The build directory can be loaded in Firefox through the `about:debugging` page for development purpose,
* `$ npm run build-ext` : compile the source files and build the addon "zip" file, ready for submission to addons.mozilla.org :)
* `$ npm run test`: runs the tests associated to this project.


### Linter

If you want to, `eslint` is configured and can help you in the development process. You'll need to set it up with `npm install -g eslint` and then setup your text editor of choice so that it's able to display the linter warnings.


### Workflow

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
