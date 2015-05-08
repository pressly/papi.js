clean:
	@rm -rf dist
	@rm -rf node_modules

install:
	@npm install

build: install
	@(export NODE_ENV=production && \
	  npm run build)

rebuild: clean build

test: install
	@npm run test
