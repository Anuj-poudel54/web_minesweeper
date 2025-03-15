
emcc -o wasm.js main.c --js-library=lib.js -sEXPORTED_RUNTIME_METHODS="['ccall','cwrap']" -sEXPORTED_FUNCTIONS="['_initialize_game_states','_set_cell_count','_change_cell_values','_is_playing','_has_won','_get_cell_at', '_dprint', '_set_bomb_probability', '_set_empty_cell_probability','_malloc','_free']"

