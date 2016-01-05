.PHONY: test

clean:
	@rm -rf build
	@rm -rf node_modules

install:
	@npm install

build: install
	@(export NODE_ENV=production && \
		npm run build)

rebuild: clean build

test:
	@npm run test

test-server:
	@NOCK_OFF=true npm run test

test-watch:
	@npm run test-watch
