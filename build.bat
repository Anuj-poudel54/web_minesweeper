
emcc -o ./src/dist/wasm.js ./src/main.c --js-library=./src/lib.js -sEXPORTED_RUNTIME_METHODS="['ccall','cwrap']" -sEXPORTED_FUNCTIONS="['_initialize_game_states','_set_cell_count','_change_cell_values','_is_playing','_has_won','_get_cell_at', '_dprint', '_set_bomb_probability', '_set_empty_cell_probability','_free_all', '_malloc','_free']"

