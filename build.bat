emcc -o wasm.js main.c -sEXPORTED_RUNTIME_METHODS="['ccall']" -sEXPORTED_FUNCTIONS="['_greet_console']"
