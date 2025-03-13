#include <stdio.h>
#include <stdlib.h>

#ifndef VECTOR_n
#define VECTOR_n

typedef struct
{
    int x, y;
} Vec2;

typedef struct
{
    Vec2 *data;
    int f;
    int b;
    int capacity;
} Vec2Q;

#ifdef USING_VECTOR_IMPL
#define USING_VECTOR_IMPL

Vec2Q *create_vect2_q()
{
    Vec2Q *q = (Vec2Q *)malloc(sizeof(Vec2Q));
    q->data = (Vec2 *)malloc(sizeof(Vec2) * 3);
    q->f = 0;
    q->b = 0;
    q->capacity = 3;
}

void vec2q_enqueue(Vec2Q *q, Vec2 vec)
{
    if (q->f >= q->capacity)
    {
        q->data = (Vec2 *)realloc(q->data, sizeof(Vec2) * q->capacity * 2);
        q->capacity *= 2;
    }
    q->data[q->f++] = vec;
}

int vec2q_is_empty(Vec2Q *q)
{
    return q->f <= 0 || q->b == q->f;
}

Vec2 vec2q_dequeue(Vec2Q *q)
{
    if (vec2q_is_empty(q))
    {
        return (Vec2){-1, -1};
    }
    return q->data[q->b++];
}

void vec2q_free(Vec2Q *q)
{
}

#endif // USING_VECTOR_IMPL
#endif // VECTOR_n