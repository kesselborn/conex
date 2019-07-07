lint:
	eslint --fix *.js

	@res="$$(grep -n 'function(' *.js)"; \
			test -n "$${res}" && { echo "found forbidden function statements:"; echo "$${res}"; }; \
			test -z "$${res}"

	@res="$$(grep -n 'console.log' *.js)"; \
			test -n "$${res}" && { echo "found forbidden console.log statements:"; echo "$${res}"; }; \
			test -z "$${res}"
