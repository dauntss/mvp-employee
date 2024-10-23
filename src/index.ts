import inquirer from 'inquirer';
import pg from 'pg';

// Database configuration
const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'employees',
    password: '2589',
    port: 5432, // Default PostgreSQL port
});

// Function to display the main menu
async function mainMenu() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View all departments', 
                'View all roles',
                'View all employees',
                'Add a department', 
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'Exit',
            ],
        },
    ]);

    switch (action) {
        case 'View all departments':
            await viewDepartments();

            break;
        case 'View all roles':
            await viewRoles();
            break;
        case 'View all employees':
            await viewEmployees();
            break;
        case 'Add a department':
            await addDepartment();
            break;
        case 'Add a role':
            await addRole();
            break;
        case 'Add an employee':
            await addEmployee();
            break;
        case 'Update an employee role':
            await updateEmployeeRole();
            break;
        case 'Exit':
            process.exit(); 

    }

    mainMenu(); // Return to the menu after an action
}

// Function to view all departments
async function viewDepartments() {
    const result = await pool.query('SELECT * FROM department');
    console.table(result.rows);
}

// Function to view all roles
async function viewRoles() {
    const result = await pool.query(
        'SELECT role.title, role.id, department.name AS department, role.salary FROM role JOIN department ON role.department = department.id');
    console.table(result.rows);
}

// Function to view all employees
async function viewEmployees() {
    const result = await pool.query(
        `
        SELECT 
            employee.id, 
            employee.first_name, 
            employee.last_name, 
            role.title AS job_title, 
            department.name AS department, 
            role.salary,
 
            manager.first_name || ' ' || manager.last_name AS manager
        FROM 
            employee
        JOIN 
            role ON employee.role_id = role.id
        JOIN 
            department ON role.department = department.id

        LEFT JOIN 
            employee AS manager ON employee.manager_id = manager.id 

    `
    );
    console.table(result.rows);
}

// Function to add a department
async function addDepartment() {
    const { name } = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Enter the name of the department:',
        },
    ]);

    await pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
    console.log('Department added successfully!');
}

// Function to add a role
async function addRole() {
    const departments = await pool.query('SELECT * FROM department');

    const { title, salary, department } = await inquirer.prompt([
        {
            type: 'input',
            name: 'title',
            message: 'Enter the title of the role:',
        },
        {
            type: 'input',
            name: 'salary',
            message: 'Enter the salary for the role:',
        },
        {
            type: 'list',
            name: 'department',
            message: 'Select the department for this role:',
            choices: departments.rows.map((dept) => ({
                name: dept.name,
                value: dept.id,
            })),
        },
    ]);

    await pool.query('INSERT INTO role (title, salary, department) VALUES ($1, $2, $3)', [
        title,
        salary,
        department,
    ]);
    console.log('Role added successfully!');
}

// Function to add an employee
async function addEmployee() {
    const roles = await pool.query('SELECT * FROM role');
    const managers = await pool.query('SELECT id, first_name, last_name FROM employee');

    const { first_name, last_name, role_id, manager_id } = await inquirer.prompt([
        {
            type: 'input',
            name: 'first_name',
            message: "Enter the employee's first name:",
        },
        {
            type: 'input',
            name: 'last_name',
            message: "Enter the employee's last name:",
        },
        {
            type: 'list',
            name: 'role_id',
            message: "Select the employee's role:",
            choices: roles.rows. 
map((role) => ({
                name: role.title,
                value: role.id,
            })),
        },
        {
            type: 'list',
            name: 'manager_id',
            message: "Select the employee's manager:",
            choices: [
                { name: 'None', value: null  
 },
                ...managers.rows.map((manager)  => ({
                    name: `${manager.first_name} ${manager.last_name}`,
                    value: manager.id,
                })),
            ],
        },
    ]);

    await pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [
        first_name,
        last_name,
        role_id,
        manager_id,
    ]);
    console.log('Employee added successfully!');
}

// Function to update an employee's role
async function updateEmployeeRole() {
    const employees = await pool.query('SELECT id, first_name, last_name FROM employee');
    const roles = await pool.query('SELECT * FROM role');

    const { employee_id, role_id } = await inquirer.prompt([
        {
            type: 'list',
            name: 'employee_id',
            message: 'Select the employee to update:',
            choices: employees.rows.map((emp) => ({
                name: `${emp.first_name} ${emp.last_name}`,
                value: emp.id,
            })),
        },
        {
            type: 'list',
            name: 'role_id',
            message: 'Select the new role:',
            choices: roles.rows.map((role) => ({
                name: role.title,
                value: role.id,
            })),
        },
    ]);

    await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [role_id, employee_id]);
    console.log('Employee role updated successfully!');
}

// Start the application
mainMenu();