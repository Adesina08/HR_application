/*
 * HR Portal Application
 *
 * This script implements client‑side logic for a simple HR management
 * interface. It uses the browser's localStorage to persist data between
 * sessions, allowing users to manage employee profiles and leave requests
 * without a server. Each page initializes its UI when the DOM is ready.
 */

// -----------------------------------------------------------------------------
// Data access functions
// -----------------------------------------------------------------------------

function getEmployees() {
  try {
    return JSON.parse(localStorage.getItem('employees')) || [];
  } catch (e) {
    return [];
  }
}

function saveEmployees(list) {
  localStorage.setItem('employees', JSON.stringify(list));
}

function getLeaves() {
  try {
    return JSON.parse(localStorage.getItem('leaves')) || [];
  } catch (e) {
    return [];
  }
}

function saveLeaves(list) {
  localStorage.setItem('leaves', JSON.stringify(list));
}

function getNextId(key) {
  // Retrieve and increment a numeric counter in localStorage
  const val = parseInt(localStorage.getItem(key) || '0', 10) + 1;
  localStorage.setItem(key, String(val));
  return val;
}

function getEmployeeById(id) {
  const employees = getEmployees();
  return employees.find((emp) => emp.id === id);
}

function getLeaveById(id) {
  const leaves = getLeaves();
  return leaves.find((lv) => lv.id === id);
}

function updateEmployee(updated) {
  const employees = getEmployees();
  const idx = employees.findIndex((emp) => emp.id === updated.id);
  if (idx >= 0) {
    employees[idx] = updated;
    saveEmployees(employees);
  }
}

function deleteEmployeeById(id) {
  let employees = getEmployees();
  employees = employees.filter((emp) => emp.id !== id);
  saveEmployees(employees);
  // Also remove leaves associated with this employee
  let leaves = getLeaves();
  leaves = leaves.filter((lv) => lv.employee_id !== id);
  saveLeaves(leaves);
}

function updateLeave(updated) {
  const leaves = getLeaves();
  const idx = leaves.findIndex((lv) => lv.id === updated.id);
  if (idx >= 0) {
    leaves[idx] = updated;
    saveLeaves(leaves);
  }
}

// -----------------------------------------------------------------------------
// Data access functions for performance reviews and announcements
//
// A performance review is an object with the following shape:
// {
//   id: number,
//   employee_id: number,
//   reviewer_id: number,
//   period: string,
//   description: string,
//   rating: number|null,
//   comment: string,
//   status: 'Pending' | 'Completed',
//   created_at: ISODateString
// }
// Announcements have the following shape:
// {
//   id: number,
//   title: string,
//   content: string,
//   created_by: number,
//   created_at: ISODateString
// }

function getReviews() {
  try {
    return JSON.parse(localStorage.getItem('reviews')) || [];
  } catch (e) {
    return [];
  }
}

function saveReviews(list) {
  localStorage.setItem('reviews', JSON.stringify(list));
}

function getReviewById(id) {
  const reviews = getReviews();
  return reviews.find((rv) => rv.id === id);
}

function updateReview(updated) {
  const reviews = getReviews();
  const idx = reviews.findIndex((rv) => rv.id === updated.id);
  if (idx >= 0) {
    reviews[idx] = updated;
    saveReviews(reviews);
  }
}

function getAnnouncements() {
  try {
    return JSON.parse(localStorage.getItem('announcements')) || [];
  } catch (e) {
    return [];
  }
}

function saveAnnouncements(list) {
  localStorage.setItem('announcements', JSON.stringify(list));
}

function getAnnouncementById(id) {
  const announcements = getAnnouncements();
  return announcements.find((a) => a.id === id);
}

function updateAnnouncement(updated) {
  const announcements = getAnnouncements();
  const idx = announcements.findIndex((a) => a.id === updated.id);
  if (idx >= 0) {
    announcements[idx] = updated;
    saveAnnouncements(announcements);
  }
}

// -----------------------------------------------------------------------------
// Additional data access functions for goals and user sessions
// -----------------------------------------------------------------------------

/**
 * Retrieve the list of goals from localStorage.
 * Each goal has the shape:
 * {
 *   id: number,
 *   employee_id: number,
 *   description: string,
 *   status: 'Pending' | 'Approved' | 'Rejected',
 *   manager_decision: boolean|null,
 *   manager_comment: string,
 *   created_at: ISODateString
 * }
 */
function getGoals() {
  try {
    return JSON.parse(localStorage.getItem('goals')) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Persist the list of goals to localStorage.
 * @param {Array} list
 */
function saveGoals(list) {
  localStorage.setItem('goals', JSON.stringify(list));
}

/**
 * Find a single goal by ID.
 * @param {number} id
 */
function getGoalById(id) {
  const goals = getGoals();
  return goals.find((g) => g.id === id);
}

/**
 * Update an existing goal in the store.
 * @param {Object} updated
 */
function updateGoal(updated) {
  const goals = getGoals();
  const idx = goals.findIndex((g) => g.id === updated.id);
  if (idx >= 0) {
    goals[idx] = updated;
    saveGoals(goals);
  }
}

/**
 * Get the currently logged in user's ID from localStorage.
 * Returns null if no user is logged in.
 */
function getCurrentUserId() {
  const raw = localStorage.getItem('currentUserId');
  if (!raw) return null;
  const id = parseInt(raw, 10);
  return isNaN(id) ? null : id;
}

/**
 * Set the current user ID in localStorage.
 * @param {number} id
 */
function setCurrentUserId(id) {
  localStorage.setItem('currentUserId', String(id));
}

/**
 * Clear the current user session.
 */
function clearCurrentUserId() {
  localStorage.removeItem('currentUserId');
}

/**
 * Retrieve the current user object from employees list.
 * Returns null if not logged in or user not found.
 */
function getCurrentUser() {
  const id = getCurrentUserId();
  if (id === null) return null;
  const user = getEmployees().find((emp) => emp.id === id) || null;
  // Ensure a default role for users created before roles were introduced
  if (user && !user.role) {
    user.role = 'employee';
  }
  return user;
}

/**
 * Log the user out by clearing the current user ID and navigating to login page.
 */
function logout() {
  clearCurrentUserId();
  window.location.href = 'login.html';
}

// -----------------------------------------------------------------------------
// Page initializers for login, staff dashboard and goals
// -----------------------------------------------------------------------------

/**
 * Initialize the login page. Populates a dropdown of existing employees and
 * handles login form submission. When a user selects their name and logs in,
 * their ID is stored in localStorage under `currentUserId` and they are
 * redirected to the appropriate dashboard (HR users go to index.html, others
 * go to staff_dashboard.html).
 */
function initLogin() {
  const employees = getEmployees();
  const select = document.getElementById('loginEmployeeSelect');
  const form = document.getElementById('loginForm');
  const noEmployeesMsg = document.getElementById('noEmployeesMessage');
  if (!select || !form) return;
  if (employees.length === 0) {
    if (noEmployeesMsg) noEmployeesMsg.classList.remove('d-none');
    select.disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }
  // Populate dropdown
  select.innerHTML = '<option value="" disabled selected>Select your name</option>';
  employees.forEach((emp) => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = `${emp.first_name} ${emp.last_name} (${emp.role || 'employee'})`;
    select.appendChild(opt);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = parseInt(select.value, 10);
    if (!userId) {
      showAlert('Please select your name.', 'danger');
      return;
    }
    setCurrentUserId(userId);
    const user = getEmployeeById(userId);
    if (user && user.role === 'hr') {
      window.location.href = 'index.html';
    } else {
      window.location.href = 'staff_dashboard.html';
    }
  });
}

/**
 * Initialize the staff dashboard page. Displays personalized information for
 * employees, managers and HR. Shows counts of goals and leaves relevant to the
 * current user as cards. Redirects to login if no user is logged in.
 */
function initStaffDashboard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  // Display user info
  const nameEl = document.getElementById('userName');
  const roleEl = document.getElementById('userRole');
  const deptEl = document.getElementById('userDepartment');
  if (nameEl) nameEl.textContent = `${user.first_name} ${user.last_name}`;
  if (roleEl) roleEl.textContent = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Employee';
  if (deptEl) deptEl.textContent = user.department || '-';

  // Determine relevant goals and leaves
  let goals = getGoals();
  let leaves = getLeaves();
  if (user.role === 'employee') {
    goals = goals.filter((g) => g.employee_id === user.id);
    leaves = leaves.filter((lv) => lv.employee_id === user.id);
  } else if (user.role === 'manager') {
    // Manager sees their own goals/leaves plus their team's
    const employees = getEmployees();
    const teamIds = employees
      .filter((emp) => emp.manager_id === user.id)
      .map((emp) => emp.id);
    goals = goals.filter((g) => g.employee_id === user.id || teamIds.includes(g.employee_id));
    leaves = leaves.filter((lv) => lv.employee_id === user.id || teamIds.includes(lv.employee_id));
  } else if (user.role === 'hr') {
    // HR sees all
    // Already assigned
  }
  // Compute counts
  let totalGoals = goals.length;
  let pendingGoals = 0;
  let approvedGoals = 0;
  let rejectedGoals = 0;
  goals.forEach((g) => {
    if (g.status === 'Pending') pendingGoals += 1;
    else if (g.status === 'Approved') approvedGoals += 1;
    else if (g.status === 'Rejected') rejectedGoals += 1;
  });
  let totalLeaves = leaves.length;
  let pendingLeaves = 0;
  let approvedLeaves = 0;
  let rejectedLeaves = 0;
  leaves.forEach((lv) => {
    if (lv.status === 'Pending') pendingLeaves += 1;
    else if (lv.status === 'Approved') approvedLeaves += 1;
    else if (lv.status === 'Rejected') rejectedLeaves += 1;
  });
  const cards = [];
  cards.push({ title: 'My/Team Goals', count: totalGoals, icon: 'fa-bullseye', color: 'primary' });
  cards.push({ title: 'Pending Goals', count: pendingGoals, icon: 'fa-hourglass-half', color: 'warning' });
  cards.push({ title: 'Approved Goals', count: approvedGoals, icon: 'fa-check-circle', color: 'success' });
  cards.push({ title: 'Rejected Goals', count: rejectedGoals, icon: 'fa-times-circle', color: 'danger' });
  cards.push({ title: 'My/Team Leaves', count: totalLeaves, icon: 'fa-file-signature', color: 'info' });
  cards.push({ title: 'Pending Leaves', count: pendingLeaves, icon: 'fa-clock', color: 'warning' });
  cards.push({ title: 'Approved Leaves', count: approvedLeaves, icon: 'fa-check-circle', color: 'success' });
  cards.push({ title: 'Rejected Leaves', count: rejectedLeaves, icon: 'fa-times-circle', color: 'danger' });
  const container = document.getElementById('staffDashboardCards');
  if (container) {
    container.innerHTML = '';
    cards.forEach((card) => {
      const col = document.createElement('div');
      col.className = 'col-md-3 col-sm-6';
      col.innerHTML = `
        <div class="card text-center shadow-sm mb-3">
          <div class="card-body">
            <i class="fa-solid ${card.icon} fa-2x text-${card.color} mb-2"></i>
            <h6 class="card-title">${card.title}</h6>
            <p class="card-text fs-5">${card.count}</p>
          </div>
        </div>`;
      container.appendChild(col);
    });
  }
}

/**
 * Initialize the goals listing page. Filters goals based on the current user's
 * role: employees see their own goals, managers see their own goals and those
 * of their direct reports, and HR sees all goals. Renders a table with goal
 * summaries and a link to view details. Displays an "Add Goal" button for
 * employees to create new objectives.
 */
function initGoals() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  let goals = getGoals();
  const employees = getEmployees();
  if (user.role === 'employee') {
    goals = goals.filter((g) => g.employee_id === user.id);
  } else if (user.role === 'manager') {
    const teamIds = employees.filter((emp) => emp.manager_id === user.id).map((emp) => emp.id);
    goals = goals.filter((g) => g.employee_id === user.id || teamIds.includes(g.employee_id));
  } else if (user.role === 'hr') {
    // HR sees all goals
  }
  const container = document.getElementById('goalsTableContainer');
  const addBtn = document.getElementById('addGoalButton');
  if (user.role === 'employee') {
    if (addBtn) addBtn.classList.remove('d-none');
  } else if (addBtn) {
    addBtn.classList.add('d-none');
  }
  if (!container) return;
  if (goals.length === 0) {
    container.innerHTML = '<p>No goals have been created yet.</p>';
    return;
  }
  let table = '<div class="table-responsive"><table class="table table-hover table-bordered align-middle">';
  table += '<thead class="table-light"><tr>';
  if (user.role !== 'employee') table += '<th>Employee</th>';
  table += '<th>Description</th><th>Status</th><th>Created</th><th>Actions</th>';
  table += '</tr></thead><tbody>';
  // sort by most recent
  goals.sort((a, b) => b.id - a.id);
  goals.forEach((goal) => {
    let row = '<tr>';
    if (user.role !== 'employee') {
      const emp = employees.find((e) => e.id === goal.employee_id);
      const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
      row += `<td>${name}</td>`;
    }
    const truncated = goal.description.length > 40 ? goal.description.substring(0, 40) + '...' : goal.description;
    row += `<td>${truncated}</td>`;
    const badge = goal.status === 'Pending'
      ? '<span class="badge bg-warning text-dark">Pending</span>'
      : goal.status === 'Approved'
        ? '<span class="badge bg-success">Approved</span>'
        : '<span class="badge bg-danger">Rejected</span>';
    row += `<td>${badge}</td>`;
    row += `<td>${goal.created_at.split('T')[0]}</td>`;
    row += `<td><a href="goal_detail.html?id=${goal.id}" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-eye"></i> View</a></td>`;
    row += '</tr>';
    table += row;
  });
  table += '</tbody></table></div>';
  container.innerHTML = table;
}

/**
 * Initialize the goal creation form. Only employees can access this page. The
 * form collects a description of the goal and saves it with status Pending
 * associated with the current user. Redirects back to the goals list after
 * submission.
 */
function initGoalForm() {
  const user = getCurrentUser();
  if (!user || user.role !== 'employee') {
    window.location.href = 'login.html';
    return;
  }
  const form = document.getElementById('goalForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('goalDescription').value.trim();
    if (!desc) {
      showAlert('Goal description cannot be empty.', 'danger');
      return;
    }
    const goals = getGoals();
    const newGoal = {
      id: getNextId('goals_last_id'),
      employee_id: user.id,
      description: desc,
      status: 'Pending',
      manager_decision: null,
      manager_comment: '',
      created_at: new Date().toISOString(),
    };
    goals.push(newGoal);
    saveGoals(goals);
    showAlert('Goal submitted for approval.', 'success');
    setTimeout(() => {
      window.location.href = 'goals.html';
    }, 500);
  });
}

/**
 * Initialize the goal detail page. Displays full information about a goal. If
 * the current user is the line manager for the goal's owner and the goal is
 * pending, displays a form to approve or reject with comments. Other users
 * can only view the details. After a manager decision, the goal's status is
 * updated accordingly.
 */
function initGoalDetail() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const idParam = getQueryParam('id');
  const goalId = idParam ? parseInt(idParam, 10) : null;
  if (!goalId) {
    showAlert('Invalid goal ID.', 'danger');
    return;
  }
  const goal = getGoalById(goalId);
  if (!goal) {
    showAlert('Goal not found.', 'danger');
    return;
  }
  const employees = getEmployees();
  const owner = employees.find((e) => e.id === goal.employee_id);
  const container = document.getElementById('goalDetailsContainer');
  if (!container) return;
  let html = `<div class="card mb-4 shadow-sm"><div class="card-body">`;
  html += `<h5 class="card-title">Goal Details</h5>`;
  if (user.role !== 'employee' || user.id !== goal.employee_id) {
    const ownerName = owner ? `${owner.first_name} ${owner.last_name}` : 'Unknown';
    html += `<p class="mb-2"><strong>Employee:</strong> ${ownerName}</p>`;
  }
  html += `<p class="mb-2"><strong>Description:</strong> ${goal.description}</p>`;
  html += `<p class="mb-2"><strong>Created At:</strong> ${goal.created_at}</p>`;
  const statusBadge = goal.status === 'Pending'
    ? '<span class="badge bg-warning text-dark">Pending</span>'
    : goal.status === 'Approved'
      ? '<span class="badge bg-success">Approved</span>'
      : '<span class="badge bg-danger">Rejected</span>';
  html += `<p class="mb-2"><strong>Status:</strong> ${statusBadge}</p>`;
  html += '<hr />';
  // Manager decision section
  html += '<div class="mt-3">';
  html += '<h6>Manager Decision</h6>';
  const isLineManager = owner && owner.manager_id === user.id;
  if (goal.manager_decision !== null) {
    html += `<p><span class="badge ${goal.manager_decision ? 'bg-success' : 'bg-danger'}">${goal.manager_decision ? 'Approved' : 'Rejected'}</span></p>`;
    if (goal.manager_comment) {
      html += `<p><strong>Comment:</strong> ${goal.manager_comment}</p>`;
    }
  } else if (goal.status === 'Pending' && isLineManager) {
    // Show form for manager
    html += `
      <form id="goalDecisionForm" class="mb-3">
        <div class="mb-2">
          <label class="form-label">Decision<span class="text-danger">*</span></label>
          <select name="decision" class="form-select" required>
            <option value="" disabled selected>Select decision</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Comment</label>
          <textarea name="comment" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    `;
  } else {
    html += '<p>No decision yet.</p>';
  }
  html += '</div>';
  html += '</div></div>';
  container.innerHTML = html;
  // Attach form listener
  const decisionForm = document.getElementById('goalDecisionForm');
  if (decisionForm) {
    decisionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const decisionVal = decisionForm.querySelector('select[name="decision"]').value;
      const commentVal = decisionForm.querySelector('textarea[name="comment"]').value.trim();
      let decisionBool = null;
      if (decisionVal === 'approve') decisionBool = true;
      else if (decisionVal === 'reject') decisionBool = false;
      goal.manager_decision = decisionBool;
      goal.manager_comment = commentVal;
      goal.status = decisionBool ? 'Approved' : 'Rejected';
      updateGoal(goal);
      showAlert('Decision recorded', 'success');
      initGoalDetail();
    });
  }
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function showAlert(message, type = 'success') {
  // Create an alert element and insert into #alerts container
  const alertsContainer = document.getElementById('alerts');
  if (!alertsContainer) return;
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
  alertsContainer.appendChild(wrapper.firstElementChild);
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// -----------------------------------------------------------------------------
// Page initializers
// -----------------------------------------------------------------------------

function initDashboard() {
  const employees = getEmployees();
  const leaves = getLeaves();
  const totalEmployees = employees.length;
  const totalLeaves = leaves.length;
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  leaves.forEach((lv) => {
    if (lv.status === 'Pending') pending += 1;
    else if (lv.status === 'Approved') approved += 1;
    else if (lv.status === 'Rejected') rejected += 1;
  });
  const cards = [
    {
      title: 'Employees',
      count: totalEmployees,
      icon: 'fa-users',
      color: 'primary',
    },
    {
      title: 'Total Leaves',
      count: totalLeaves,
      icon: 'fa-file-signature',
      color: 'success',
    },
    {
      title: 'Pending Leaves',
      count: pending,
      icon: 'fa-clock',
      color: 'warning',
    },
    {
      title: 'Approved Leaves',
      count: approved,
      icon: 'fa-check-circle',
      color: 'info',
    },
    {
      title: 'Rejected Leaves',
      count: rejected,
      icon: 'fa-times-circle',
      color: 'danger',
    },
  ];
  const container = document.getElementById('dashboardCards');
  if (!container) return;
  container.innerHTML = '';
  cards.forEach((card) => {
    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6';
    col.innerHTML = `
      <div class="card text-center shadow-sm mb-3">
        <div class="card-body">
          <i class="fa-solid ${card.icon} fa-2x text-${card.color} mb-2"></i>
          <h5 class="card-title">${card.title}</h5>
          <p class="card-text fs-4">${card.count}</p>
        </div>
      </div>
    `;
    container.appendChild(col);
  });
}

function initEmployees() {
  const employees = getEmployees();
  const container = document.getElementById('employeesTableContainer');
  if (!container) return;
  if (employees.length === 0) {
    container.innerHTML = '<p>No employees found. Click "Add Employee" to create a new record.</p>';
    return;
  }
  let table = '<div class="table-responsive"><table class="table table-hover table-bordered align-middle">';
  table += '<thead class="table-light"><tr>';
  table += '<th>#</th><th>Name</th><th>Email</th><th>Department</th><th>Position</th><th>Actions</th>';
  table += '</tr></thead><tbody>';
  employees.forEach((emp) => {
    const name = `${emp.first_name} ${emp.last_name}`;
    table += '<tr>';
    table += `<td>${emp.id}</td>`;
    table += `<td>${name}</td>`;
    table += `<td>${emp.email}</td>`;
    table += `<td>${emp.department || '-'}</td>`;
    table += `<td>${emp.position || '-'}</td>`;
    table += `<td>
      <a href="employee_form.html?id=${emp.id}" class="btn btn-sm btn-outline-secondary me-1" title="Edit"><i class="fa-solid fa-pen"></i></a>
      <button class="btn btn-sm btn-outline-danger" data-id="${emp.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
    </td>`;
    table += '</tr>';
  });
  table += '</tbody></table></div>';
  container.innerHTML = table;
  // Attach delete handlers
  container.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const empId = parseInt(btn.getAttribute('data-id'), 10);
      if (confirm('Are you sure you want to delete this employee?')) {
        deleteEmployeeById(empId);
        showAlert('Employee deleted', 'success');
        initEmployees();
      }
    });
  });
}

function initEmployeeForm() {
  const idParam = getQueryParam('id');
  const formHeading = document.getElementById('formHeading');
  const empIdInput = document.getElementById('employeeId');
  const firstNameInput = document.getElementById('first_name');
  const lastNameInput = document.getElementById('last_name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const deptInput = document.getElementById('department');
  const positionInput = document.getElementById('position');
  const roleInput = document.getElementById('role');
  const managerSelect = document.getElementById('manager_id');
  const dobInput = document.getElementById('date_of_birth');
  const hireInput = document.getElementById('hire_date');
  const addressInput = document.getElementById('address');
  // Populate manager dropdown with other employees (excluding current record)
  const populateManagers = (currentId) => {
    const employees = getEmployees();
    // Add a default option
    managerSelect.innerHTML = '<option value="">-- None --</option>';
    employees.forEach((emp) => {
      // Exclude the employee itself
      if (!currentId || emp.id !== currentId) {
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.first_name} ${emp.last_name}`;
        managerSelect.appendChild(opt);
      }
    });
  };
  if (idParam) {
    const empId = parseInt(idParam, 10);
    const emp = getEmployeeById(empId);
    if (!emp) {
      showAlert('Employee not found', 'danger');
    } else {
      formHeading.textContent = 'Edit Employee';
      empIdInput.value = emp.id;
      firstNameInput.value = emp.first_name;
      lastNameInput.value = emp.last_name;
      emailInput.value = emp.email;
      phoneInput.value = emp.phone || '';
      deptInput.value = emp.department || '';
      positionInput.value = emp.position || '';
      // Populate role and manager fields for editing
      roleInput.value = emp.role || 'employee';
      // Populate manager options and set selected
      populateManagers(emp.id);
      if (emp.manager_id) {
        managerSelect.value = emp.manager_id;
      }
      dobInput.value = emp.date_of_birth || '';
      hireInput.value = emp.hire_date || '';
      addressInput.value = emp.address || '';
    }
  } else {
    formHeading.textContent = 'Add Employee';
    // Populate managers list for new employee (no current id)
    populateManagers(null);
  }
  const form = document.getElementById('employeeForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const employees = getEmployees();
    const data = {
      id: idParam ? parseInt(idParam, 10) : getNextId('employees_last_id'),
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      department: deptInput.value.trim(),
      position: positionInput.value.trim(),
      date_of_birth: dobInput.value,
      hire_date: hireInput.value,
      address: addressInput.value.trim(),
      role: roleInput.value || 'employee',
      manager_id: managerSelect.value ? parseInt(managerSelect.value, 10) : null,
    };
    // Basic validation
    if (!data.first_name || !data.last_name || !data.email) {
      showAlert('First name, last name and email are required.', 'danger');
      return;
    }
    // Check unique email
    const duplicate = employees.find(
      (e) => e.email.toLowerCase() === data.email.toLowerCase() && e.id !== data.id
    );
    if (duplicate) {
      showAlert('An employee with this email already exists.', 'danger');
      return;
    }
    if (idParam) {
      // Update existing employee
      updateEmployee(data);
      showAlert('Employee details updated', 'success');
    } else {
      // Add new employee
      employees.push(data);
      saveEmployees(employees);
      showAlert('Employee added successfully', 'success');
    }
    // Redirect back to employees list after slight delay
    setTimeout(() => {
      window.location.href = 'employees.html';
    }, 500);
  });
}

function initLeaves() {
  let leaves = getLeaves();
  const employees = getEmployees();
  const user = getCurrentUser();
  // Filter leaves for non-HR users
  if (user && user.role !== 'hr') {
    if (user.role === 'manager') {
      const teamIds = employees.filter((emp) => emp.manager_id === user.id).map((emp) => emp.id);
      leaves = leaves.filter((lv) => lv.employee_id === user.id || teamIds.includes(lv.employee_id));
    } else {
      // employee sees only their own leaves
      leaves = leaves.filter((lv) => lv.employee_id === user.id);
    }
  }
  const container = document.getElementById('leavesTableContainer');
  if (!container) return;
  if (leaves.length === 0) {
    container.innerHTML = '<p>No leave requests have been submitted yet.</p>';
    return;
  }
  let table = '<div class="table-responsive"><table class="table table-bordered table-hover align-middle">';
  table += '<thead class="table-light"><tr>';
  table += '<th>#</th><th>Employee</th><th>Period</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th>';
  table += '</tr></thead><tbody>';
  leaves.sort((a, b) => b.id - a.id);
  leaves.forEach((lv) => {
    const emp = employees.find((e) => e.id === lv.employee_id);
    const employeeName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
    const statusBadge = lv.status === 'Pending'
      ? '<span class="badge bg-warning text-dark">Pending</span>'
      : lv.status === 'Approved'
        ? '<span class="badge bg-success">Approved</span>'
        : '<span class="badge bg-danger">Rejected</span>';
    table += '<tr>';
    table += `<td>${lv.id}</td>`;
    table += `<td>${employeeName}</td>`;
    table += `<td>${lv.start_date} to ${lv.end_date}</td>`;
    table += `<td>${lv.leave_type}</td>`;
    table += `<td>${statusBadge}</td>`;
    table += `<td>${lv.created_at.split('T')[0]}</td>`;
    table += `<td><a href="leave_detail.html?id=${lv.id}" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-eye"></i> View</a></td>`;
    table += '</tr>';
  });
  table += '</tbody></table></div>';
  container.innerHTML = table;
}

function initLeaveForm() {
  const employees = getEmployees();
  const employeeSelect = document.getElementById('employee_id');
  const user = getCurrentUser();
  // If there is a logged in user who is not HR, automatically select them and hide the dropdown
  if (user && user.role !== 'hr') {
    if (employeeSelect) {
      employeeSelect.innerHTML = '';
      const opt = document.createElement('option');
      opt.value = user.id;
      opt.textContent = `${user.first_name} ${user.last_name}`;
      employeeSelect.appendChild(opt);
      employeeSelect.disabled = true;
    }
  } else {
    // HR or no user: populate full employee list
    if (employees.length === 0) {
      showAlert('Please add employees before creating a leave request.', 'warning');
      employeeSelect.innerHTML = '<option value="" disabled>No employees available</option>';
      document.getElementById('leaveForm').querySelector('button[type="submit"]').disabled = true;
      return;
    }
    employeeSelect.innerHTML = '<option value="" disabled selected>Select employee</option>';
    employees.forEach((emp) => {
      const opt = document.createElement('option');
      opt.value = emp.id;
      const deptOrPosition = emp.department || emp.position || '';
      opt.textContent = `${emp.first_name} ${emp.last_name}${deptOrPosition ? ' (' + deptOrPosition + ')' : ''}`;
      employeeSelect.appendChild(opt);
    });
  }
  const form = document.getElementById('leaveForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = parseInt(employeeSelect.value, 10);
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    const leaveType = document.getElementById('leave_type').value;
    const reason = document.getElementById('reason').value.trim();
    if (!empId || !startDate || !endDate || !leaveType) {
      showAlert('All required fields must be completed.', 'danger');
      return;
    }
    const leaves = getLeaves();
    const newLeave = {
      id: getNextId('leaves_last_id'),
      employee_id: empId,
      start_date: startDate,
      end_date: endDate,
      leave_type: leaveType,
      reason: reason,
      status: 'Pending',
      manager_approved: null,
      manager_comment: '',
      hr_approved: null,
      hr_comment: '',
      created_at: new Date().toISOString(),
    };
    leaves.push(newLeave);
    saveLeaves(leaves);
    showAlert('Leave request submitted', 'success');
    setTimeout(() => {
      window.location.href = 'leaves.html';
    }, 500);
  });
}

function initLeaveDetail() {
  const idParam = getQueryParam('id');
  const leaveId = idParam ? parseInt(idParam, 10) : null;
  if (!leaveId) {
    showAlert('Invalid leave ID', 'danger');
    return;
  }
  const leave = getLeaveById(leaveId);
  if (!leave) {
    showAlert('Leave request not found', 'danger');
    return;
  }
  const employees = getEmployees();
  const emp = employees.find((e) => e.id === leave.employee_id);
  const employeeName = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
  const container = document.getElementById('leaveDetailsContainer');
  if (!container) return;
  // Build HTML
  let html = `<div class="card mb-4 shadow-sm"><div class="card-body">`;
  html += `<h5 class="card-title">Employee: ${employeeName}</h5>`;
  html += `<p class="card-text mb-2"><strong>Leave Period:</strong> ${leave.start_date} to ${leave.end_date}</p>`;
  html += `<p class="card-text mb-2"><strong>Type:</strong> ${leave.leave_type}</p>`;
  html += `<p class="card-text mb-2"><strong>Reason:</strong> ${leave.reason || 'N/A'}</p>`;
  html += `<p class="card-text mb-2"><strong>Submitted At:</strong> ${leave.created_at}</p>`;
  const statusBadge = leave.status === 'Pending'
    ? '<span class="badge bg-warning text-dark">Pending</span>'
    : leave.status === 'Approved'
      ? '<span class="badge bg-success">Approved</span>'
      : '<span class="badge bg-danger">Rejected</span>';
  html += `<p class="card-text mb-2"><strong>Status:</strong> ${statusBadge}</p>`;
  html += '<hr />';
  html += '<div class="row">';
  // Manager section
  html += '<div class="col-md-6">';
  html += '<h6>Manager Decision</h6>';
  // Determine current user roles
  const currentUser = getCurrentUser();
  const isLineManager = currentUser && emp && emp.manager_id === currentUser.id;
  const isHRUser = currentUser && currentUser.role === 'hr';
  if (leave.manager_approved !== null) {
    html += `<p><span class="badge ${leave.manager_approved ? 'bg-success' : 'bg-danger'}">${leave.manager_approved ? 'Approved' : 'Rejected'}</span></p>`;
    if (leave.manager_comment) {
      html += `<p><strong>Comment:</strong> ${leave.manager_comment}</p>`;
    }
  } else if (isLineManager) {
    html += `
      <form id="managerDecisionForm" class="mb-3">
        <div class="mb-2">
          <label class="form-label">Decision<span class="text-danger">*</span></label>
          <select name="decision" class="form-select" required>
            <option value="" disabled selected>Select decision</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Comment</label>
          <textarea name="comment" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    `;
  } else {
    html += '<p>No decision yet.</p>';
  }
  html += '</div>';
  // HR section
  html += '<div class="col-md-6">';
  html += '<h6>HR Decision</h6>';
  if (leave.hr_approved !== null) {
    html += `<p><span class="badge ${leave.hr_approved ? 'bg-success' : 'bg-danger'}">${leave.hr_approved ? 'Approved' : 'Rejected'}</span></p>`;
    if (leave.hr_comment) {
      html += `<p><strong>Comment:</strong> ${leave.hr_comment}</p>`;
    }
  } else if (isHRUser) {
    html += `
      <form id="hrDecisionForm" class="mb-3">
        <div class="mb-2">
          <label class="form-label">Decision<span class="text-danger">*</span></label>
          <select name="decision" class="form-select" required>
            <option value="" disabled selected>Select decision</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Comment</label>
          <textarea name="comment" class="form-control" rows="2"></textarea>
        </div>
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    `;
  } else {
    html += '<p>No decision yet.</p>';
  }
  html += '</div></div></div></div>';
  container.innerHTML = html;
  // Attach event listeners for forms if present
  const managerForm = document.getElementById('managerDecisionForm');
  if (managerForm) {
    managerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const decision = managerForm.querySelector('select[name="decision"]').value;
      const comment = managerForm.querySelector('textarea[name="comment"]').value.trim();
      let managerDecision = null;
      if (decision === 'approve') managerDecision = true;
      else if (decision === 'reject') managerDecision = false;
      // Update leave object
      leave.manager_approved = managerDecision;
      leave.manager_comment = comment;
      // Update status
      if (managerDecision === false) {
        leave.status = 'Rejected';
      } else if (managerDecision === true && (leave.hr_approved === true || leave.hr_approved === null)) {
        if (leave.hr_approved === true) leave.status = 'Approved';
        else leave.status = 'Pending';
      }
      updateLeave(leave);
      showAlert('Decision recorded', 'success');
      initLeaveDetail();
    });
  }
  const hrForm = document.getElementById('hrDecisionForm');
  if (hrForm) {
    hrForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const decision = hrForm.querySelector('select[name="decision"]').value;
      const comment = hrForm.querySelector('textarea[name="comment"]').value.trim();
      let hrDecision = null;
      if (decision === 'approve') hrDecision = true;
      else if (decision === 'reject') hrDecision = false;
      // Update leave object
      leave.hr_approved = hrDecision;
      leave.hr_comment = comment;
      // Update status
      if (hrDecision === false) {
        leave.status = 'Rejected';
      } else if (hrDecision === true && (leave.manager_approved === true || leave.manager_approved === null)) {
        if (leave.manager_approved === true) leave.status = 'Approved';
        else leave.status = 'Pending';
      }
      updateLeave(leave);
      showAlert('Decision recorded', 'success');
      initLeaveDetail();
    });
  }
}

// -----------------------------------------------------------------------------
// Performance reviews
// -----------------------------------------------------------------------------

function initReviews() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const employees = getEmployees();
  let reviews = getReviews();
  // Filter reviews based on role
  if (user.role === 'employee') {
    reviews = reviews.filter((rv) => rv.employee_id === user.id);
  } else if (user.role === 'manager') {
    const teamIds = employees.filter((e) => e.manager_id === user.id).map((e) => e.id);
    reviews = reviews.filter((rv) => rv.employee_id === user.id || teamIds.includes(rv.employee_id));
  }
  const addBtn = document.getElementById('addReviewButton');
  if (addBtn) {
    if (user.role === 'manager' || user.role === 'hr') {
      addBtn.classList.remove('d-none');
    } else {
      addBtn.classList.add('d-none');
    }
  }
  const container = document.getElementById('reviewsTableContainer');
  if (!container) return;
  if (reviews.length === 0) {
    container.innerHTML = '<p>No reviews available yet.</p>';
    return;
  }
  // Build table
  let html = '<div class="table-responsive"><table class="table table-bordered table-hover align-middle">';
  html += '<thead class="table-light"><tr>';
  if (user.role !== 'employee') html += '<th>Employee</th>';
  html += '<th>Period</th><th>Status</th><th>Rating</th><th>Actions</th></tr></thead><tbody>';
  // Sort by most recent
  reviews.sort((a, b) => b.id - a.id);
  reviews.forEach((rv) => {
    html += '<tr>';
    if (user.role !== 'employee') {
      const emp = employees.find((e) => e.id === rv.employee_id);
      const name = emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown';
      html += `<td>${name}</td>`;
    }
    html += `<td>${rv.period}</td>`;
    const statusBadge = rv.status === 'Pending'
      ? '<span class="badge bg-warning text-dark">Pending</span>'
      : '<span class="badge bg-success">Completed</span>';
    html += `<td>${statusBadge}</td>`;
    html += `<td>${rv.rating !== null ? rv.rating : '-'}</td>`;
    html += `<td><a href="review_detail.html?id=${rv.id}" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-eye"></i> View</a></td>`;
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  container.innerHTML = html;
}

function initReviewForm() {
  const user = getCurrentUser();
  if (!user || (user.role !== 'manager' && user.role !== 'hr')) {
    window.location.href = 'login.html';
    return;
  }
  const form = document.getElementById('reviewForm');
  const employeeSelect = document.getElementById('review_employee_id');
  const periodInput = document.getElementById('review_period');
  const descInput = document.getElementById('review_description');
  if (!form) return;
  // Populate employee dropdown
  const employees = getEmployees();
  employeeSelect.innerHTML = '<option value="" disabled selected>Select employee</option>';
  employees.forEach((emp) => {
    // Managers only see their team and themselves; HR sees all
    if (user.role === 'hr' || emp.manager_id === user.id) {
      const opt = document.createElement('option');
      opt.value = emp.id;
      opt.textContent = `${emp.first_name} ${emp.last_name}`;
      employeeSelect.appendChild(opt);
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const empId = parseInt(employeeSelect.value, 10);
    const period = periodInput.value.trim();
    const description = descInput.value.trim();
    if (!empId || !period || !description) {
      showAlert('All fields are required.', 'danger');
      return;
    }
    const reviews = getReviews();
    const newReview = {
      id: getNextId('reviews_last_id'),
      employee_id: empId,
      reviewer_id: user.id,
      period: period,
      description: description,
      rating: null,
      comment: '',
      status: 'Pending',
      created_at: new Date().toISOString(),
    };
    reviews.push(newReview);
    saveReviews(reviews);
    showAlert('Review created successfully.', 'success');
    setTimeout(() => {
      window.location.href = 'reviews.html';
    }, 500);
  });
}

function initReviewDetail() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const idParam = getQueryParam('id');
  const reviewId = idParam ? parseInt(idParam, 10) : null;
  if (!reviewId) {
    showAlert('Invalid review ID', 'danger');
    return;
  }
  const review = getReviewById(reviewId);
  if (!review) {
    showAlert('Review not found', 'danger');
    return;
  }
  const employees = getEmployees();
  const employee = employees.find((e) => e.id === review.employee_id);
  const reviewer = employees.find((e) => e.id === review.reviewer_id);
  const container = document.getElementById('reviewDetailsContainer');
  if (!container) return;
  let html = '<div class="card shadow-sm"><div class="card-body">';
  html += '<h5 class="card-title">Performance Review</h5>';
  if (employee) html += `<p><strong>Employee:</strong> ${employee.first_name} ${employee.last_name}</p>`;
  if (reviewer) html += `<p><strong>Reviewer:</strong> ${reviewer.first_name} ${reviewer.last_name}</p>`;
  html += `<p><strong>Period:</strong> ${review.period}</p>`;
  html += `<p><strong>Description:</strong> ${review.description}</p>`;
  html += `<p><strong>Created At:</strong> ${review.created_at}</p>`;
  html += `<p><strong>Status:</strong> ${review.status === 'Pending' ? '<span class="badge bg-warning text-dark">Pending</span>' : '<span class="badge bg-success">Completed</span>'}</p>`;
  if (review.rating !== null) {
    html += `<p><strong>Rating:</strong> ${review.rating} / 5</p>`;
    if (review.comment) html += `<p><strong>Comment:</strong> ${review.comment}</p>`;
  }
  // Show rating form if pending and current user is reviewer
  const isReviewer = user.id === review.reviewer_id;
  if (review.status === 'Pending' && isReviewer) {
    html += '<hr />';
    html += '<form id="reviewRatingForm">';
    html += '<div class="mb-3"><label class="form-label">Rating (1-5)<span class="text-danger">*</span></label>';
    html += '<select name="rating" class="form-select" required>';
    html += '<option value="" disabled selected>Select rating</option>';
    for (let i = 1; i <= 5; i++) {
      html += `<option value="${i}">${i}</option>`;
    }
    html += '</select></div>';
    html += '<div class="mb-3"><label class="form-label">Comment</label><textarea name="comment" class="form-control" rows="3"></textarea></div>';
    html += '<button type="submit" class="btn btn-primary">Submit</button>';
    html += '</form>';
  }
  html += '</div></div>';
  container.innerHTML = html;
  const form = document.getElementById('reviewRatingForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ratingVal = parseInt(form.querySelector('select[name="rating"]').value, 10);
      const commentVal = form.querySelector('textarea[name="comment"]').value.trim();
      if (!ratingVal) {
        showAlert('Please select a rating.', 'danger');
        return;
      }
      review.rating = ratingVal;
      review.comment = commentVal;
      review.status = 'Completed';
      updateReview(review);
      showAlert('Review completed successfully.', 'success');
      initReviewDetail();
    });
  }
}

// -----------------------------------------------------------------------------
// Self‑service: My Profile
// -----------------------------------------------------------------------------

function initMyProfile() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  const firstName = document.getElementById('profile_first_name');
  const lastName = document.getElementById('profile_last_name');
  const email = document.getElementById('profile_email');
  const phone = document.getElementById('profile_phone');
  const dept = document.getElementById('profile_department');
  const position = document.getElementById('profile_position');
  const address = document.getElementById('profile_address');
  // Prefill read‑only fields
  if (firstName) firstName.value = user.first_name;
  if (lastName) lastName.value = user.last_name;
  if (email) email.value = user.email;
  if (phone) phone.value = user.phone || '';
  if (dept) dept.value = user.department || '';
  if (position) position.value = user.position || '';
  if (address) address.value = user.address || '';
  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const employees = getEmployees();
      const idx = employees.findIndex((emp) => emp.id === user.id);
      if (idx < 0) return;
      const updated = { ...employees[idx] };
      updated.phone = phone ? phone.value.trim() : '';
      updated.department = dept ? dept.value.trim() : '';
      updated.position = position ? position.value.trim() : '';
      updated.address = address ? address.value.trim() : '';
      employees[idx] = updated;
      saveEmployees(employees);
      showAlert('Profile updated successfully.', 'success');
    });
  }
}

// -----------------------------------------------------------------------------
// Announcements
// -----------------------------------------------------------------------------

function initAnnouncements() {
  const user = getCurrentUser();
  // announcements can be viewed by everyone; user may be null (not logged in) only if not forced login page
  const announcements = getAnnouncements();
  const container = document.getElementById('announcementsList');
  const addBtn = document.getElementById('addAnnouncementButton');
  if (addBtn) {
    if (user && user.role === 'hr') addBtn.classList.remove('d-none');
    else addBtn.classList.add('d-none');
  }
  if (!container) return;
  if (announcements.length === 0) {
    container.innerHTML = '<p>No announcements yet.</p>';
    return;
  }
  // Sort by created_at descending
  announcements.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  let html = '';
  announcements.forEach((a) => {
    const createdDate = a.created_at.split('T')[0];
    html += '<div class="card mb-3 shadow-sm">';
    html += '<div class="card-body">';
    html += `<h5 class="card-title">${a.title}</h5>`;
    html += `<h6 class="card-subtitle mb-2 text-muted">${createdDate}</h6>`;
    html += `<p class="card-text">${a.content}</p>`;
    // Delete button for HR
    if (user && user.role === 'hr') {
      html += `<button class="btn btn-sm btn-danger" data-id="${a.id}"><i class="fa-solid fa-trash"></i> Delete</button>`;
    }
    html += '</div></div>';
  });
  container.innerHTML = html;
  // Attach delete handlers
  if (user && user.role === 'hr') {
    container.querySelectorAll('button[data-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(btn.getAttribute('data-id'), 10);
        if (confirm('Are you sure you want to delete this announcement?')) {
          let list = getAnnouncements();
          list = list.filter((ann) => ann.id !== id);
          saveAnnouncements(list);
          showAlert('Announcement deleted.', 'success');
          initAnnouncements();
        }
      });
    });
  }
}

function initAnnouncementForm() {
  const user = getCurrentUser();
  if (!user || user.role !== 'hr') {
    window.location.href = 'login.html';
    return;
  }
  const form = document.getElementById('announcementForm');
  const titleInput = document.getElementById('announcement_title');
  const contentInput = document.getElementById('announcement_content');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    if (!title || !content) {
      showAlert('Title and content are required.', 'danger');
      return;
    }
    const announcements = getAnnouncements();
    const newAnnouncement = {
      id: getNextId('announcements_last_id'),
      title: title,
      content: content,
      created_by: user.id,
      created_at: new Date().toISOString(),
    };
    announcements.push(newAnnouncement);
    saveAnnouncements(announcements);
    showAlert('Announcement created.', 'success');
    setTimeout(() => {
      window.location.href = 'announcements.html';
    }, 500);
  });
}

// -----------------------------------------------------------------------------
// Analytics & Reporting
// -----------------------------------------------------------------------------

function initAnalytics() {
  const user = getCurrentUser();
  if (!user || user.role !== 'hr') {
    window.location.href = 'login.html';
    return;
  }
  // Prepare data for charts
  const employees = getEmployees();
  const leaves = getLeaves();
  const goals = getGoals();
  // Chart 1: Employees per department
  const deptCounts = {};
  employees.forEach((emp) => {
    const dept = emp.department || 'Unassigned';
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });
  const deptLabels = Object.keys(deptCounts);
  const deptData = Object.values(deptCounts);
  // Chart 2: Leave status distribution
  const leaveCounts = { Pending: 0, Approved: 0, Rejected: 0 };
  leaves.forEach((lv) => {
    leaveCounts[lv.status] = (leaveCounts[lv.status] || 0) + 1;
  });
  const leaveLabels = Object.keys(leaveCounts);
  const leaveData = Object.values(leaveCounts);
  // Chart 3: Goal status distribution
  const goalCounts = { Pending: 0, Approved: 0, Rejected: 0 };
  goals.forEach((g) => {
    goalCounts[g.status] = (goalCounts[g.status] || 0) + 1;
  });
  const goalLabels = Object.keys(goalCounts);
  const goalData = Object.values(goalCounts);
  // Create charts using Chart.js
  // Chart 1
  const deptCtx = document.getElementById('deptChart').getContext('2d');
  new Chart(deptCtx, {
    type: 'bar',
    data: {
      labels: deptLabels,
      datasets: [
        {
          label: 'Employees',
          data: deptData,
          backgroundColor: '#007bff',
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Department',
          },
        },
        y: {
          title: {
            display: true,
            text: 'Number of Employees',
          },
          beginAtZero: true,
        },
      },
    },
  });
  // Chart 2
  const leaveCtx = document.getElementById('leaveChart').getContext('2d');
  new Chart(leaveCtx, {
    type: 'pie',
    data: {
      labels: leaveLabels,
      datasets: [
        {
          label: 'Leave Requests',
          data: leaveData,
          backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
  // Chart 3
  const goalCtx = document.getElementById('goalChart').getContext('2d');
  new Chart(goalCtx, {
    type: 'pie',
    data: {
      labels: goalLabels,
      datasets: [
        {
          label: 'Goals',
          data: goalData,
          backgroundColor: ['#ffc107', '#28a745', '#dc3545'],
        },
      ],
    },
    options: {
      responsive: true,
    },
  });
}