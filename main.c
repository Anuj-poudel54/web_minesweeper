#include <stdio.h>
#include <stdlib.h>
#include "vector.h"
#define EXTERNAL

// cells values
const int EMPTY = 0; // in cell's value
const int BOMB = -1; // in cell's value

// Configurations
const int HACK = 0;
const float BOMB_PROBABILITY = 0.3;
const float EMPTY_CELL_PROBABILITY = 0.7;

// Game states
int hint_number_count = 0;
int reveal_hint_numbers = 0;
int playing = 1;
int won = 0;
int row = 0, col = 0;

typedef struct
{
    int value;
    int flagged;
    int show;
} Cell;

int cell_count = 0;
Cell **boardArray = NULL;
int is_board_initialized = 0;

extern float get_random_value();

int is_legal_coord(Vec2 vec)
{
    return vec.x >= 0 && vec.y >= 0 && vec.x < cell_count && vec.y < cell_count;
}

Vec2 neighbours[8] = {0};
int get_legal_moore_neighbours(int i, int j)
{
    // Returns moore neighbours' count for index i j
    int k = 0;
    for (int m = -1; m <= 1; m++)
    {
        for (int n = -1; n <= 1; n++)
        {
            Vec2 vec = {i + m, j + n};
            if ((vec.x == i && vec.y == j) || !is_legal_coord(vec))
                continue;
            neighbours[k++] = (Vec2){.x = vec.x, .y = vec.y};
        }
    }
    return k;
}

EXTERNAL
int initialize_game_states()
{

    if (!is_board_initialized)
        return 0;

    won = 0;
    playing = 1;
    row = 0, col = 0;

    // Generating bomb
    for (int i = 0; i < cell_count; i++)
    {
        for (int j = 0; j < cell_count; j++)
        {
            float cellValue = get_random_value() < BOMB_PROBABILITY ? BOMB : EMPTY;
            Cell cell = (Cell){cellValue, 0, 0};
            boardArray[i][j] = cell;
        }
    }

    // populating hint numbers and empty cells
    for (int i = 0; i < cell_count; i++)
    {
        for (int j = 0; j < cell_count; j++)
        {
            Cell cell = boardArray[i][j];
            if (cell.value == BOMB)
                continue;

            int neighs_count = get_legal_moore_neighbours(i, j);
            int can_be_empty = 0;
            for (int i = 0; i < neighs_count; i++)
            {
                int x = neighbours[i].x, y = neighbours[i].y;
                if (boardArray[x][y].value == BOMB)
                {
                    can_be_empty = 1;
                    break;
                }
            }

            if (can_be_empty && get_random_value() < EMPTY_CELL_PROBABILITY)
                continue;

            // calculating bomb counts

            int total_bomb_around = 0;
            for (int i = 0; i < neighs_count; i++)
            {
                int x = neighbours[i].x, y = neighbours[i].y;
                if (boardArray[x][y].value == BOMB)
                    total_bomb_around++;
            }

            boardArray[i][j].value = total_bomb_around;
            hint_number_count++;
        }
    }
    return 1;
}

EXTERNAL
void set_cell_count(int cell_count_a)
{
    boardArray = (int **)malloc(cell_count_a * sizeof(int *));
    if (boardArray == NULL)
    {
        return;
    }

    for (int i = 0; i < cell_count_a; i++)
    {
        boardArray[i] = (Cell *)malloc(cell_count_a * sizeof(Cell));
        if (boardArray[i] == NULL)
            return;
    }
    cell_count = cell_count_a;
    is_board_initialized = 1;
}

EXTERNAL
int change_cell_values(int row_a, int col_a, int flagged, int show)
{
    if (row_a >= cell_count || col_a >= cell_count)
        return 0;
    boardArray[row_a][col_a].flagged = flagged;
    boardArray[row_a][col_a].show = show;

    return 1;
}

/*
puts cell values in 'cell_arr' array and return 1 but if
row and col exceeded the boardArray size it returns 0;
*/
EXTERNAL
int get_next_cell(int *cell_arr)
{
    if (col >= cell_count)
    {
        row++;
        col = 0;
    }
    if (row >= cell_count)
    {
        row = 0;
        col = 0;
        return 0;
    }
    Cell cell = boardArray[row][col++];
    cell_arr[0] = cell.value;
    cell_arr[1] = cell.flagged;
    cell_arr[2] = cell.show;

    return 1;
}

EXTERNAL int is_playing()
{
    return playing;
}

EXTERNAL void reveal_empty_cell(int x, int y)
{
    // TODO:
    // Using dfs for searching empty cells
    boardArray[x][y].show = 0;
    int q[] = [[x, y]];
    while (q.length > 0)
    {
        let[x, y] = q.pop();

        const neighs = getLegalMooreNeighbours(x, y);

        for (let[currX, currY] of neighs)
        {
            let cell = boardArray[currX][currY];
            if (cell.value >= EMPTY && !cell.show && !cell.flagged)
            {
                boardArray[currX][currY].show = true;
                if (cell.value == = EMPTY)
                    q.push([ currX, currY ]);
            }
        }
    }
}

EXTERNAL int has_playing()
{
    return won;
}

EXTERNAL int get_cell_at(int x, int y, int *cell_arr)
{
    Cell cell = boardArray[x][y];
    cell_arr[0] = cell.value;
    cell_arr[1] = cell.flagged;
    cell_arr[2] = cell.show;
}

EXTERNAL void greet_console()
{
    printf("WASM is working...\n");
}
