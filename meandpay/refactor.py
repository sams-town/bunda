import os

file_path = r'c:\Users\viprs\Videos\proj\bunda\meandpay\src\AdminRouter.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add Imports
import_str = """
import { PremiumSidebar } from './components/common/PremiumSidebar';
import { PremiumHeader } from './components/common/PremiumHeader';
import { PremiumDashboard } from './components/common/PremiumDashboard';
"""
last_import_idx = text.rfind('import ')
end_of_last_import = text.find(';', last_import_idx) + 1
text = text[:end_of_last_import] + import_str + text[end_of_last_import:]

# 2. Find start of HRStatCard to remove
hr_start = text.find('function HRStatCard')
# Find the main return (
return_start = text.find('return (', hr_start)
animate_start = text.find('<AnimatePresence mode="wait">', return_start)

layout_str = """return (
    <div className="h-screen flex overflow-hidden font-sans bg-[#F8FAFC]">
      <PremiumSidebar 
         user={user}
         settings={settings}
         currentPage={currentPage}
         isSidebarCollapsed={isSidebarCollapsed}
         setCurrentPage={setCurrentPage as any}
         unreadCount={unreadCount}
         isAdmin={isAdmin}
         hasPermission={hasPermission}
         handleLogout={handleLogout}
         isAbsensiOpen={isAbsensiOpen}
         isOvertimeOpen={isOvertimeOpen}
         isVisitOpen={isVisitOpen}
         isFinanceOpen={isFinanceOpen}
         setIsAbsensiOpen={setIsAbsensiOpen}
         setIsOvertimeOpen={setIsOvertimeOpen}
         setIsVisitOpen={setIsVisitOpen}
         setIsFinanceOpen={setIsFinanceOpen}
      />
      <main className="flex-1 flex flex-col relative z-0 min-w-0">
        <PremiumHeader 
           user={user}
           isSidebarCollapsed={isSidebarCollapsed}
           setIsSidebarCollapsed={setIsSidebarCollapsed}
           unreadCount={unreadCount}
           isNotificationsOpen={isNotificationsOpen}
           setIsNotificationsOpen={setIsNotificationsOpen}
           isProfileMenuOpen={isProfileMenuOpen}
           setIsProfileMenuOpen={setIsProfileMenuOpen}
           handleLogout={handleLogout}
           profileMenuRef={profileMenuRef}
           bellRef={bellRef}
           previewNotifications={previewNotifications}
           handleMarkRead={handleMarkRead}
           currentPage={currentPage}
        />
        <div className="flex-1 overflow-y-auto scrollbar-hide relative z-0">
          """

text = text[:hr_start] + layout_str + text[animate_start:]

# 3. Replace Dashboard case inside AnimatePresence
dash_start = text.find("{currentPage === 'dashboard' ? (")
dash_end = text.find(") : currentPage === 'notifications' ? (", dash_start)

dashboard_case = """{currentPage === 'dashboard' ? (
                <PremiumDashboard 
                   dashboardStats={dashboardStats}
                   calendarDate={calendarDate}
                   setCalendarDate={setCalendarDate}
                   calendarView={calendarView}
                   setCalendarView={setCalendarView}
                />
"""

text = text[:dash_start] + dashboard_case + text[dash_end:]

# 4. Remove all helper functions at the end of the file (SidebarItem, etc)
# Those functions start immediately after `</main>\n    </div>\n  );\n}`
# We will just find `function SidebarItem` and truncate there.
end_comp = text.find('function SidebarItem')
if end_comp != -1:
    text = text[:end_comp]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Refactor complete.")
