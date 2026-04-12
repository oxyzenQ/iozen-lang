#!/bin/bash
# IOZEN Performance Benchmark
# Compares interpreted vs compiled execution

echo "=========================================="
echo "IOZEN Performance Benchmark"
echo "=========================================="
echo ""

# Benchmark file
FILE="examples/benchmark.iozen"

echo "1. INTERPRETED (bun run iozen run)"
echo "----------------------------------------"
time bun run iozen run $FILE
echo ""

echo "2. COMPILED (native binary)"
echo "----------------------------------------"
bun run iozen compile $FILE --output benchmark_temp
gcc -o examples/benchmark_temp examples/benchmark_temp.c -lm
time ./examples/benchmark_temp
echo ""

# Cleanup
rm -f examples/benchmark_temp examples/benchmark_temp.c

echo "=========================================="
echo "Benchmark Complete"
echo "=========================================="
