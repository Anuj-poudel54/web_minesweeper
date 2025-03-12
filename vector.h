
#include<stdio.h>
#include<stdlib.h>
#ifndef VECTOR
#define VECTOR

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

Vec2Q *create_vect2_q(){
    Vec2Q *q = (Vec2Q*)malloc(sizeof(Vec2Q));
    q->data = (Vec2*)malloc(sizeof(Vec2) * 3);
    q->f = 0;
    q->b = 0;
    q->capacity = 3;
}


void vec2_enqueue(Vec2Q *q, Vec2 vec){
    printf("Queueing\n");
    if (q->f >= q->capacity){
        q->data = (Vec2*)realloc(q->data, sizeof(Vec2)*q->capacity*2);
        q->capacity *= 2;
    }
    q->data[q->f++] = vec;
}

Vec2 vec2_dequeue(Vec2Q *q){
    if (q->b < 0 || q->b >= q->f){
        return (Vec2){-1,-1};
    }
    return q->data[q->b++];
}

int vec2_is_empty(Vec2Q *q){
        return q->f <= 0;
}

#endif // VECTOR