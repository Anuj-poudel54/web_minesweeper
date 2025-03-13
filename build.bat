emcc -o wasm.js main.c --js-library=lib.js -sEXPORTED_RUNTIME_METHODS="['ccall','cwrap']" -sEXPORTED_FUNCTIONS="['_initialize_game_states','_set_cell_count','_change_cell_values','_is_playing','_reveal_empty_cells','_has_won','_get_cell_at','_get_hint_number_count' ,'_dprint','_malloc','_free']"