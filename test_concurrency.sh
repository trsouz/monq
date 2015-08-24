#!/usr/bin/env bash

export dc="docker-compose -f docker-compose-concurrency.yml"
function up(){
    echo -e "\n\n$1: Starting\n"
    $dc scale $1=0 &> /dev/null
    $dc rm -f &> /dev/null
    $dc up -d $1 &> /dev/null
    $dc scale $1=0 &> /dev/null
    $dc run --rm $1 node test/clear.js &> /dev/null
    $dc run --rm $1 node test/populate.js &> /dev/null
    $dc scale $1=5 &> /dev/null
    $dc logs $1 &> /dev/null
    echo -e "\n\n$1: Finished\n\n"
}

time up test1
$dc run --rm test1 node test/print.js
time up test2
$dc run --rm test2 node test/print.js
time up test3
$dc run --rm test3 node test/print.js
time up test4
$dc run --rm test4 node test/print.js
