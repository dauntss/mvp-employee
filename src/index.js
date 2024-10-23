"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer_1 = __importDefault(require("inquirer"));
const pg_1 = __importDefault(require("pg"));
// Database configuration
const pool = new pg_1.default.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'employees',
    password: '20Trixie12*',
    port: 5432, // Default PostgreSQL port
});
// Function to display the main menu
function mainMenu() {
    return __awaiter(this, void 0, void 0, function* () {
        const { action } = yield inquirer_1.default.prompt([
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
                yield viewDepartments();
                break;
            case 'View all roles':
                yield viewRoles();
                break;
            case 'View all employees':
                yield viewEmployees();
                break;
            case 'Add a department':
                yield addDepartment();
                break;
            case 'Add a role':
                yield addRole();
                break;
            case 'Add an employee':
                yield addEmployee();
                break;
            case 'Update an employee role':
                yield updateEmployeeRole();
                break;
            case 'Exit':
                process.exit();
        }
        mainMenu(); // Return to the menu after an action
    });
}
// Function to view all departments
function viewDepartments() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query('SELECT * FROM department');
        console.table(result.rows);
    });
}
// Function to view all roles
function viewRoles() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query('SELECT role.title, role.id, department.name AS department, role.salary FROM role JOIN department ON role.department = department.id');
        console.table(result.rows);
    });
}
// Function to view all employees
function viewEmployees() {
    return __awaiter(this, void 0, void 0, function* () {
        const result = yield pool.query(`
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

    `);
        console.table(result.rows);
    });
}
// Function to add a department
function addDepartment() {
    return __awaiter(this, void 0, void 0, function* () {
        const { name } = yield inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter the name of the department:',
            },
        ]);
        yield pool.query('INSERT INTO department (name) VALUES ($1)', [name]);
        console.log('Department added successfully!');
    });
}
// Function to add a role
function addRole() {
    return __awaiter(this, void 0, void 0, function* () {
        const departments = yield pool.query('SELECT * FROM department');
        const { title, salary, department } = yield inquirer_1.default.prompt([
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
        yield pool.query('INSERT INTO role (title, salary, department) VALUES ($1, $2, $3)', [
            title,
            salary,
            department,
        ]);
        console.log('Role added successfully!');
    });
}
// Function to add an employee
function addEmployee() {
    return __awaiter(this, void 0, void 0, function* () {
        const roles = yield pool.query('SELECT * FROM role');
        const managers = yield pool.query('SELECT id, first_name, last_name FROM employee');
        const { first_name, last_name, role_id, manager_id } = yield inquirer_1.default.prompt([
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
                    ...managers.rows.map((manager) => ({
                        name: `${manager.first_name} ${manager.last_name}`,
                        value: manager.id,
                    })),
                ],
            },
        ]);
        yield pool.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', [
            first_name,
            last_name,
            role_id,
            manager_id,
        ]);
        console.log('Employee added successfully!');
    });
}
// Function to update an employee's role
function updateEmployeeRole() {
    return __awaiter(this, void 0, void 0, function* () {
        const employees = yield pool.query('SELECT id, first_name, last_name FROM employee');
        const roles = yield pool.query('SELECT * FROM role');
        const { employee_id, role_id } = yield inquirer_1.default.prompt([
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
        yield pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [role_id, employee_id]);
        console.log('Employee role updated successfully!');
    });
}
// Start the application
mainMenu();
