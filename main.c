#include <stdio.h>
#include <stdlib.h>

#define USING_VECTOR_IMPL
#include "vector.h"
#define EXTERNAL

// cells values
const int EMPTY = 0; // represents empty cell
const int BOMB = -1; // represents empty cell

// Configurations
float BOMB_PROBABILITY = 0.3;
float EMPTY_CELL_PROBABILITY = 0.5;

// Game states
int hint_number_count = 0;
int revealed_count = 0;
int playing = 1;
int won = 0;

typedef struct
{
    int value;
    int flagged;
    int show;
} Cell;

int cell_count = 0;
Cell **boardArray = NULL;
int is_board_initialized = 0;

/* Imported function.
 Returns value ranging [0,1]
 */
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

void reveal_cell(int x, int y)
{
    if (!is_legal_coord((Vec2){x, y}))
        return;

    boardArray[x][y].show = 1;
    if (boardArray[x][y].value > EMPTY)
        revealed_count++;
}

// exported functions

EXTERNAL int initialize_game_states()
{

    if (!is_board_initialized)
        return 0;

    won = 0;
    playing = 1;
    hint_number_count = 0;
    revealed_count = 0;

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
            int can_be_empty = 1;
            // a cell can be empty only when it is surrounded by a number cell or other empty cells
            for (int i = 0; i < neighs_count; i++)
            {
                int x = neighbours[i].x, y = neighbours[i].y;
                if (boardArray[x][y].value != BOMB)
                {
                    can_be_empty = 0;
                    break;
                }
            }

            if (can_be_empty && get_random_value() < EMPTY_CELL_PROBABILITY)
                continue;

            // calculating bomb counts
            int total_bomb_around = 0;
            for (int i = 0; i < neighs_count; i++)
            {
                int x = neighbours[i].x;
                int y = neighbours[i].y;
                if (boardArray[x][y].value == BOMB)
                    total_bomb_around++;
            }

            boardArray[i][j].value = total_bomb_around;

            // if total_bomb_around is 0, it will be interpreted as emtpy cell so checking it before incrementing hint_number_count
            if (boardArray[i][j].value > EMPTY)
                hint_number_count++;
        }
    }

    return 1;
}

EXTERNAL void set_cell_count(int cell_count_a)
{
    // board is already initialized with cell_count_a number of rows and cols.
    if (is_board_initialized && cell_count_a == cell_count)
        return;

    boardArray = (Cell **)malloc(cell_count_a * sizeof(Cell *));
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

void reveal_empty_cells(int x, int y)
{
    // Using dfs for searching empty cells
    boardArray[x][y].show = 1;

    // int q[] = [[x, y]];
    Vec2Q *q = create_vect2_q();
    vec2q_enqueue(q, (Vec2){x, y});

    // while (q.length > 0)
    while (!vec2q_is_empty(q))
    {
        // let[x, y] = q.pop();
        Vec2 v = vec2q_dequeue(q);
        int x = v.x, y = v.y;

        // const neighs = getLegalMooreNeighbours(x, y);
        int neighs_count = get_legal_moore_neighbours(x, y);

        // for (let[currX, currY] of neighs)
        for (int i = 0; i < neighs_count; i++)
        {
            // let cell = boardArray[currX][currY];
            Vec2 v = neighbours[i];
            int curr_x = v.x, curr_y = v.y;
            Cell cell = boardArray[curr_x][curr_y];

            if (cell.value >= EMPTY && !cell.show && !cell.flagged)
            {
                reveal_cell(curr_x, curr_y);
                if (cell.value == EMPTY)
                {
                    // q.push([ currX, currY ]);
                    vec2q_enqueue(q, (Vec2){curr_x, curr_y});
                }
            }
        }
    }
    vec2q_free(q);
}

EXTERNAL int change_cell_values(int row_a, int col_a, int flagged, int show)
{
    if (row_a >= cell_count || col_a >= cell_count || !playing || won)
        return 0;

    if (show)
        reveal_cell(row_a, col_a);

    if (hint_number_count == revealed_count)
    {
        playing = 0;
        won = 1;
    }
    if (boardArray[row_a][col_a].value == BOMB && show)
    {
        playing = 0;
    }
    if (boardArray[row_a][col_a].value == EMPTY && show)
    {

        reveal_empty_cells(row_a, col_a);
    }
    boardArray[row_a][col_a].flagged = flagged;
    boardArray[row_a][col_a].show = show;

    return 1;
}

EXTERNAL int is_playing()
{
    return playing;
}

EXTERNAL int has_won()
{
    return won;
}

/* value of cell at index [x][y] will be appended in cell_arr in order of {value, flagged, show}
If post x y is not legal return 0 else 1
*/
EXTERNAL int
get_cell_at(int x, int y, int *cell_arr)
{
    if (!is_legal_coord((Vec2){x, y}))
        return 0;
    Cell cell = boardArray[x][y];
    cell_arr[0] = cell.value;
    cell_arr[1] = cell.flagged;
    cell_arr[2] = cell.show;
    return 1;
}
EXTERNAL void set_bomb_probability(float prob)
{
    BOMB_PROBABILITY = prob;
}

EXTERNAL void set_empty_cell_probability(float prob)
{
    EMPTY_CELL_PROBABILITY = prob;
}

EXTERNAL void dprint()
{
    printf("WASM is working...\n");
    printf("Random value generator working:  %f\n", get_random_value());
}
