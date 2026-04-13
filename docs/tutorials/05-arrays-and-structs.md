# Tutorial 5: Arrays and Structs 📦

Learn to work with collections of data and create custom types.

## What You'll Learn

- Creating and using arrays
- Defining custom struct types
- Combining arrays and structs
- Practical data modeling

## Arrays - Collections of Data

An array stores multiple values of the same type.

### Creating Arrays

```iozen
# Array of integers
create var scores as array of integer with values [85, 92, 78, 95, 88]

# Array of text (strings)
create var names as array of text with values ["Alice", "Bob", "Carol"]

# Empty array
create var empty as array of integer with values []
```

### Accessing Elements

Arrays use **0-based indexing** (first element is at position 0):

```iozen
create var fruits as array of text with values ["Apple", "Banana", "Cherry", "Date"]

print fruits[0]    # Apple (first element)
print fruits[1]    # Banana (second element)
print fruits[3]    # Date (fourth element)

# Get the last element
create var lastIndex as integer with value array_length fruits - 1
print fruits[lastIndex]    # Date
```

### Common Array Operations

```iozen
# Length
create var count as integer with value array_length fruits
print "Number of fruits: " attach count    # 4

# Add element
array_push fruits "Elderberry"
print "Added! Now: " attach array_length fruits    # 5
```

### Iterating Over Arrays

```iozen
# Using for...in loop
print "My favorite fruits:"
for fruit in fruits do
    print "- " attach fruit
end

# Using while loop with index
print ""
print "Using index:"
create var i as integer with value 0
while i < array_length fruits repeat
    print i attach ": " attach fruits[i]
    assign i with value i + 1
end
```

### Array Calculations

```iozen
# Calculate sum
create var numbers as array of integer with values [10, 20, 30, 40, 50]

create var sum as integer with value 0
for n in numbers do
    assign sum with value sum + n
end
print "Sum: " attach sum    # 150

# Calculate average
create var average as decimal with value to_decimal sum / to_decimal array_length numbers
print "Average: " attach average    # 30.0

# Find maximum
create var max as integer with value numbers[0]
for n in numbers do
    if n > max then
        assign max with value n
    end
end
print "Maximum: " attach max    # 50
```

## Structs - Custom Data Types

Structs let you create your own data types with named fields.

### Defining a Struct

```iozen
type Person is
    name as text
    age as integer
    email as text
end
```

This defines a `Person` type with three fields.

### Creating Struct Instances

```iozen
# Create a Person
create var alice as Person
assign alice.name with value "Alice Johnson"
assign alice.age with value 30
assign alice.email with value "alice@example.com"

# Print the person
print "Name: " attach alice.name
print "Age: " attach alice.age
print "Email: " attach alice.email
```

### Another Example: Point

```iozen
type Point is
    x as decimal
    y as decimal
end

function createPoint takes x as decimal, y as decimal returns Point
    create var p as Point
    assign p.x with value x
    assign p.y with value y
    return p
end

function printPoint takes p as Point returns nothing
    print "(" attach p.x attach ", " attach p.y attach ")"
end

function distanceFromOrigin takes p as Point returns decimal
    return sqrt (p.x * p.x + p.y * p.y)
end

# Create points
create var origin as Point with value createPoint 0.0 0.0
create var target as Point with value createPoint 3.0 4.0

print "Origin: "
printPoint origin
print "Target: "
printPoint target
print "Distance: " attach distanceFromOrigin target    # 5.0
```

## Combining Arrays and Structs

### Array of Structs

```iozen
type Student is
    name as text
    id as integer
    grades as array of integer
end

function createStudent takes name as text, id as integer returns Student
    create var s as Student
    assign s.name with value name
    assign s.id with value id
    assign s.grades with values []
    return s
end

function addGrade takes s as Student, grade as integer returns nothing
    array_push s.grades grade
end

function getAverage takes s as Student returns decimal
    if array_length s.grades == 0 then
        return 0.0
    end
    
    create var sum as integer with value 0
    for g in s.grades do
        assign sum with value sum + g
    end
    
    return to_decimal sum / to_decimal array_length s.grades
end

function printStudent takes s as Student returns nothing
    print "---"
    print "Name: " attach s.name
    print "ID: " attach s.id
    print "Grades: "
    for g in s.grades do
        print "  " attach g
    end
    print "Average: " attach getAverage s
    print ""
end

# Create students
create var students as array of Student with values []

# Student 1
create var alice as Student with value createStudent "Alice" 1001
addGrade alice 85
addGrade alice 92
addGrade alice 78
array_push students alice

# Student 2
create var bob as Student with value createStudent "Bob" 1002
addGrade bob 88
addGrade bob 91
addGrade bob 85
addGrade bob 90
array_push students bob

# Print all students
print "=== Student Records ==="
print ""
for s in students do
    printStudent s
end

# Find class average
create var classTotal as decimal with value 0.0
for s in students do
    assign classTotal with value classTotal + getAverage s
end
create var classAverage as decimal with value classTotal / to_decimal array_length students

print "Class Average: " attach classAverage
```

### Nested Structs

```iozen
type Address is
    street as text
    city as text
    zip as text
end

type Employee is
    name as text
    age as integer
    address as Address
    salary as decimal
end

function createEmployee takes name as text, age as integer, street as text, city as text, zip as text, salary as decimal returns Employee
    create var e as Employee
    assign e.name with value name
    assign e.age with value age
    assign e.salary with value salary
    
    # Create nested address
    create var addr as Address
    assign addr.street with value street
    assign addr.city with value city
    assign addr.zip with value zip
    assign e.address with value addr
    
    return e
end

# Create employee
create var emp as Employee with value createEmployee "John Doe" 35 "123 Main St" "New York" "10001" 75000.0

print "Employee: " attach emp.name
print "Age: " attach emp.age
print "Address: " attach emp.address.street attach ", " attach emp.address.city
print "Salary: $" attach emp.salary
```

## Complete Example: Inventory System

```iozen
# Inventory Management System

type Product is
    id as integer
    name as text
    price as decimal
    quantity as integer
end

function createProduct takes id as integer, name as text, price as decimal, quantity as integer returns Product
    create var p as Product
    assign p.id with value id
    assign p.name with value name
    assign p.price with value price
    assign p.quantity with value quantity
    return p
end

function getInventoryValue takes p as Product returns decimal
    return p.price * to_decimal p.quantity
end

function isLowStock takes p as Product, threshold as integer returns boolean
    return p.quantity <= threshold
end

function printProduct takes p as Product returns nothing
    print p.id attach ": " attach p.name
    print "  Price: $" attach p.price
    print "  Qty: " attach p.quantity
    print "  Value: $" attach getInventoryValue p
    if isLowStock p 10 then
        print "  ⚠️ LOW STOCK!"
    end
    print ""
end

# Initialize inventory
create var inventory as array of Product with values []

array_push inventory createProduct 1 "Laptop" 999.99 15
array_push inventory createProduct 2 "Mouse" 29.99 50
array_push inventory createProduct 3 "Keyboard" 79.99 8
array_push inventory createProduct 4 "Monitor" 299.99 3
array_push inventory createProduct 5 "USB Cable" 9.99 100

# Print inventory report
print "=== INVENTORY REPORT ==="
print ""

for p in inventory do
    printProduct p
end

# Calculate totals
create var totalValue as decimal with value 0.0
create var totalItems as integer with value 0

for p in inventory do
    assign totalValue with value totalValue + getInventoryValue p
    assign totalItems with value totalItems + p.quantity
end

print "====================="
print "Total Products: " attach array_length inventory
print "Total Items: " attach totalItems
print "Total Value: $" attach totalValue

# Low stock alert
print ""
print "=== LOW STOCK ALERTS ==="
for p in inventory do
    if isLowStock p 10 then
        print "⚠️ " attach p.name attach " (" attach p.quantity attach " left)"
    end
end
```

## Best Practices

### 1. Use Meaningful Field Names

```iozen
# Good
type Customer is
    firstName as text
    lastName as text
    emailAddress as text
end

# Bad
type Customer is
    fn as text
    ln as text
    em as text
end
```

### 2. Initialize All Fields

```iozen
# Always assign values to all fields
create var p as Person
assign p.name with value ""
assign p.age with value 0
assign p.email with value ""
```

### 3. Use Functions to Create Structs

```iozen
# Good - encapsulated creation
function createPerson takes name as text, age as integer returns Person
    create var p as Person
    assign p.name with value name
    assign p.age with value age
    return p
end

# Use it
create var person as Person with value createPerson "Alice" 30
```

## Exercise: Library System

Create a library management system with:

1. **Book type** with fields: title, author, isbn, available (boolean)
2. **Library array** to store books
3. Functions:
   - `addBook` - Add a book to the library
   - `findBook` - Search by title
   - `checkoutBook` - Mark as unavailable
   - `returnBook` - Mark as available
   - `listAvailableBooks` - Show all available books

**Bonus:** Track who borrowed which book.

## Quick Reference

| Task | Syntax |
|------|--------|
| Define struct | `type Name is ... end` |
| Create instance | `create var x as Type` |
| Access field | `x.fieldName` |
| Assign field | `assign x.fieldName with value ...` |
| Create array | `create var x as array of type with values [...]` |
| Access element | `x[index]` |
| Array length | `array_length x` |
| Add element | `array_push x element` |
| Iterate | `for item in array do ... end` |

## Next Steps

Congratulations! You've completed all tutorials!

### What's Next?

- 📦 [Modules](../guide/language-guide.md#modules) - Organize code into files
- 📁 [File I/O](../guide/language-guide.md#file-io) - Read and write files
- 📚 [Standard Library](../stdlib/index.md) - Explore built-in functions
- 🎯 [Examples](../../examples/) - Study real programs
- 🛠️ [Build a Project](../../examples/README.md#practice-projects) - Apply your skills

### Practice Ideas

- **Contact Manager** - Store and search contacts
- **Expense Tracker** - Track expenses with categories
- **Quiz Game** - Multiple choice questions
- **Task Scheduler** - Manage daily tasks

Happy coding! 🎉
