import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './routes/PrivateRoute';
import { Login } from './pages/auth/Login';
import { Setup } from './pages/auth/Setup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { MedicinesList } from './pages/medicines/MedicinesList';
import { MedicineForm } from './pages/medicines/MedicineForm';
import { MedicineDetails } from './pages/medicines/MedicineDetails';
import { CategoriesList } from './pages/categories/CategoriesList';
import { CategoryForm } from './pages/categories/CategoryForm';
import { UnitsList } from './pages/units/UnitsList';
import { UnitForm } from './pages/units/UnitForm';
import { ManufacturersList } from './pages/manufacturers/ManufacturersList';
import { ManufacturerForm } from './pages/manufacturers/ManufacturerForm';
import { SuppliersList } from './pages/suppliers/SuppliersList';
import { SupplierForm } from './pages/suppliers/SupplierForm';
import { SalesList } from './pages/sales/SalesList';
import { SaleForm } from './pages/sales/SaleForm';
import { SaleDetails } from './pages/sales/SaleDetails';
import { InventoryList } from './pages/inventory/InventoryList';
import { UsersList } from './pages/users/UsersList';
import { UserForm } from './pages/users/UserForm';
import { CustomersList } from './pages/customers/CustomersList';
import { CustomerForm } from './pages/customers/CustomerForm';
import { PurchasesList } from './pages/purchases/PurchasesList';
import { PurchaseForm } from './pages/purchases/PurchaseForm';
import { PurchaseDetails } from './pages/purchases/PurchaseDetails';
import { SalesReport } from './pages/reports/SalesReport';
import { Settings } from './pages/settings/Settings';
import { Layout } from './components/layout/Layout';
import { GenericNamesList } from './pages/references/GenericNamesList';
import { GenericNameForm } from './pages/references/GenericNameForm';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<Setup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/medicines"
            element={
              <PrivateRoute>
                <Layout>
                  <MedicinesList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/medicines/new"
            element={
              <PrivateRoute>
                <Layout>
                  <MedicineForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/medicines/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <MedicineDetails />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/medicines/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <MedicineForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <PrivateRoute>
                <Layout>
                  <CategoriesList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories/new"
            element={
              <PrivateRoute>
                <Layout>
                  <CategoryForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/categories/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <CategoryForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/units"
            element={
              <PrivateRoute>
                <Layout>
                  <UnitsList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/units/new"
            element={
              <PrivateRoute>
                <Layout>
                  <UnitForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/units/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <UnitForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/manufacturers"
            element={
              <PrivateRoute>
                <Layout>
                  <ManufacturersList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manufacturers/new"
            element={
              <PrivateRoute>
                <Layout>
                  <ManufacturerForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/manufacturers/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <ManufacturerForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/suppliers"
            element={
              <PrivateRoute>
                <Layout>
                  <SuppliersList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers/new"
            element={
              <PrivateRoute>
                <Layout>
                  <SupplierForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/suppliers/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <SupplierForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Layout>
                  <SalesList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sales/new"
            element={
              <PrivateRoute>
                <Layout>
                  <SaleForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/sales/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <SaleDetails />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <PrivateRoute>
                <Layout>
                  <InventoryList />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Layout>
                  <UsersList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users/new"
            element={
              <PrivateRoute>
                <Layout>
                  <UserForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/users/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <UserForm />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomersList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/new"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/customers/:id/edit"
            element={
              <PrivateRoute>
                <Layout>
                  <CustomerForm />
                </Layout>
              </PrivateRoute>
            }
          />

            <Route
  path="/references/generic-names"
  element={
    <PrivateRoute>
      <Layout>
        <GenericNamesList />
      </Layout>
    </PrivateRoute>
  }
/>
<Route
  path="/references/generic-names/new"
  element={
    <PrivateRoute>
      <Layout>
        <GenericNameForm />
      </Layout>
    </PrivateRoute>
  }
/>
<Route
  path="/references/generic-names/:id/edit"
  element={
    <PrivateRoute>
      <Layout>
        <GenericNameForm />
      </Layout>
    </PrivateRoute>
  }
/>

          <Route
            path="/purchases"
            element={
              <PrivateRoute>
                <Layout>
                  <PurchasesList />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/purchases/new"
            element={
              <PrivateRoute>
                <Layout>
                  <PurchaseForm />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/purchases/:id"
            element={
              <PrivateRoute>
                <Layout>
                  <PurchaseDetails />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/reports/sales"
            element={
              <PrivateRoute>
                <Layout>
                  <SalesReport />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;