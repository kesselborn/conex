lint:
	eslint --fix *.js
	@res="${shell grep -n 'console.log' *.js}"; \
			test -n "$${res}" && { echo "found forbidden console.log statements:"; echo "$${res}"; }; \
			test -z "$${res}"
