publish:
ifeq ($(TRAVIS_BRANCH), master)
ifeq ($(TRAVIS_PULL_REQUEST), false)
	git checkout master
	git remote set-url origin git@github.com:$(TRAVIS_REPO_SLUG).git
	lerna publish --conventional-commits --yes
else
	lerna publish --conventional-commits --yes --canary --preid beta
endif
endif