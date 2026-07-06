package com.clubmanagement.club_management;

import com.clubmanagement.club_management.entity.*;
import com.clubmanagement.club_management.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class E2EFeatureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired private UserRepository userRepository;
    @Autowired private DepartmentRepository departmentRepository;
    @Autowired private EventRepository eventRepository;
    @Autowired private RecruitmentApplicationRepository recruitmentRepository;
    @Autowired private BudgetRequestRepository budgetRequestRepository;
    @Autowired private ClubFundTransactionRepository transactionRepository;
    @Autowired private InventoryItemRepository inventoryItemRepository;
    @Autowired private BorrowRequestRepository borrowRequestRepository;
    @Autowired private PollRepository pollRepository;
    @Autowired private PollOptionRepository pollOptionRepository;
    @Autowired private PollVoteRepository pollVoteRepository;
    @Autowired private EventTicketRepository ticketRepository;
    @Autowired private ResourceItemRepository resourceRepository;
    @Autowired private TeamRepository teamRepository;
    @Autowired private TeamMemberRepository teamMemberRepository;

    private Department department;
    private User admin;
    private User manager;
    private User member;
    private Event event;

    @BeforeEach
    void setUp() {
        ticketRepository.deleteAll();
        borrowRequestRepository.deleteAll();
        inventoryItemRepository.deleteAll();
        budgetRequestRepository.deleteAll();
        transactionRepository.deleteAll();
        recruitmentRepository.deleteAll();
        pollVoteRepository.deleteAll();
        pollOptionRepository.deleteAll();
        pollRepository.deleteAll();
        resourceRepository.deleteAll();
        eventRepository.deleteAll();
        teamMemberRepository.deleteAll();
        teamRepository.deleteAll();
        userRepository.deleteAll();
        departmentRepository.deleteAll();

        // Create Seed Data
        department = new Department();
        department.setName("Ban Chuyen Mon");
        department.setDescription("Technical");
        department = departmentRepository.save(department);

        admin = User.builder()
                .fullName("Admin User")
                .email("admin@club.com")
                .passwordHash("hashedpassword")
                .role(User.Role.ADMIN)
                .department(department)
                .isActive(true)
                .build();
        admin = userRepository.save(admin);

        manager = User.builder()
                .fullName("Manager User")
                .email("son.tran@club.com")
                .passwordHash("hashedpassword")
                .role(User.Role.MANAGER)
                .department(department)
                .isActive(true)
                .build();
        manager = userRepository.save(manager);

        member = User.builder()
                .fullName("Member User")
                .email("anh.pham@club.com")
                .passwordHash("hashedpassword")
                .role(User.Role.MEMBER)
                .department(department)
                .isActive(true)
                .build();
        member = userRepository.save(member);

        event = Event.builder()
                .title("Festival Nghe Thuat")
                .description("Festival")
                .location("Stage")
                .startTime(LocalDateTime.now().plusDays(2))
                .endTime(LocalDateTime.now().plusDays(2).plusHours(3))
                .status(Event.EventStatus.APPROVED)
                .department(department)
                .createdBy(admin)
                .isPublic(false)
                .build();
        event = eventRepository.save(event);
    }

    @Test
    void testRecruitmentFlow() throws Exception {
        // 1. Public user applies
        RecruitmentApplication application = RecruitmentApplication.builder()
                .fullName("Nguyen Candidate")
                .email("candidate@example.com")
                .phone("0901234567")
                .departmentId(department.getId())
                .introduction("I love coding and dancing")
                .build();

        mockMvc.perform(post("/api/public/recruitment/apply")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(application)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fullName").value("Nguyen Candidate"));

        List<RecruitmentApplication> apps = recruitmentRepository.findAll();
        assertEquals(1, apps.size());
        RecruitmentApplication savedApp = apps.get(0);
        assertEquals(RecruitmentApplication.ApplicationStatus.SUBMITTED, savedApp.getStatus());

        // 2. Admin/Manager views applications
        mockMvc.perform(get("/api/recruitment")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].fullName").value("Nguyen Candidate"));

        // 3. Admin evaluates application
        Map<String, Object> evalData = new HashMap<>();
        evalData.put("score", 85);
        evalData.put("comments", "Looks great, schedule interview");
        evalData.put("status", "INTERVIEW_SCHEDULED");
        evalData.put("interviewTime", LocalDateTime.now().plusDays(1).toString());

        mockMvc.perform(put("/api/recruitment/" + savedApp.getId() + "/evaluate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(evalData))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("INTERVIEW_SCHEDULED"))
                .andExpect(jsonPath("$.data.score").value(85));

        // 4. Admin approves application (auto-creates member account)
        mockMvc.perform(post("/api/recruitment/" + savedApp.getId() + "/approve")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify user created
        Optional<User> createdUserOpt = userRepository.findByEmail("candidate@example.com");
        assertTrue(createdUserOpt.isPresent());
        User createdUser = createdUserOpt.get();
        assertEquals("Nguyen Candidate", createdUser.getFullName());
        assertEquals(User.Role.MEMBER, createdUser.getRole());
    }

    @Test
    void testFinanceAndBudgetFlow() throws Exception {
        // 1. Manager creates budget request
        Map<String, Object> budgetBody = new HashMap<>();
        budgetBody.put("eventId", event.getId());
        budgetBody.put("title", "Nuoc uong Festival");
        budgetBody.put("amount", 200000);
        budgetBody.put("description", "Mua nuoc uong cho thanh vien tap Festival");

        MvcResult result = mockMvc.perform(post("/api/finance/budget-requests")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(budgetBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Nuoc uong Festival"))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<String, Object> dataMap = (Map<String, Object>) responseMap.get("data");
        Long budgetRequestId = ((Number) dataMap.get("id")).longValue();

        // 2. Admin approves budget request
        mockMvc.perform(put("/api/finance/budget-requests/" + budgetRequestId + "/approve")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // 3. Verify that MEMBER cannot access transactions (returns 403)
        mockMvc.perform(get("/api/finance/transactions")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("anh.pham@club.com").roles("MEMBER")))
                .andExpect(status().isForbidden());

        // 3b. Verify that ADMIN can access and that the Expense transaction was automatically recorded
        mockMvc.perform(get("/api/finance/transactions")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Tạm ứng chi sự kiện: Festival Nghe Thuat (Nuoc uong Festival)"))
                .andExpect(jsonPath("$.data[0].type").value("EXPENSE"))
                .andExpect(jsonPath("$.data[0].amount").value(200000));

        // 4. Admin manually logs an Income transaction
        Map<String, Object> transBody = new HashMap<>();
        transBody.put("title", "Tai tro tu doi ngoai");
        transBody.put("type", "INCOME");
        transBody.put("amount", 1000000);
        transBody.put("category", "SPONSOR");

        mockMvc.perform(post("/api/finance/transactions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(transBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Tai tro tu doi ngoai"))
                .andExpect(jsonPath("$.data.amount").value(1000000));
    }

    @Test
    void testInventoryAndBorrowFlow() throws Exception {
        // 1. Admin creates inventory item
        InventoryItem item = InventoryItem.builder()
                .name("Loa Keo Di Dong")
                .quantity(10)
                .availableQuantity(10)
                .description("Loa keo cong suat lon")
                .location("Warehouse")
                .itemCondition(InventoryItem.ItemCondition.GOOD)
                .build();

        MvcResult result = mockMvc.perform(post("/api/inventory")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(item))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Loa Keo Di Dong"))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<String, Object> dataMap = (Map<String, Object>) responseMap.get("data");
        Long itemId = ((Number) dataMap.get("id")).longValue();

        // 2. Member creates borrow request
        Map<String, Object> borrowBody = new HashMap<>();
        borrowBody.put("itemId", itemId);
        borrowBody.put("quantity", 3);
        borrowBody.put("borrowDate", LocalDate.now().toString());
        borrowBody.put("expectedReturnDate", LocalDate.now().plusDays(7).toString());
        borrowBody.put("notes", "Practice session");

        MvcResult borrowResult = mockMvc.perform(post("/api/inventory/borrow")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(borrowBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("anh.pham@club.com").roles("MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quantity").value(3))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        String borrowStr = borrowResult.getResponse().getContentAsString();
        Map<String, Object> borrowResponseMap = objectMapper.readValue(borrowStr, Map.class);
        Map<String, Object> borrowDataMap = (Map<String, Object>) borrowResponseMap.get("data");
        Long borrowId = ((Number) borrowDataMap.get("id")).longValue();

        // 3. Manager approves borrow request
        Map<String, String> approveBody = new HashMap<>();
        approveBody.put("status", "APPROVED");

        mockMvc.perform(put("/api/inventory/borrow/" + borrowId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(approveBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("BORROWED"));

        // Verify available quantity decreased
        InventoryItem updatedItem = inventoryItemRepository.findById(itemId).orElseThrow();
        assertEquals(7, updatedItem.getAvailableQuantity());

        // 4. Manager confirms return of item
        Map<String, String> returnBody = new HashMap<>();
        returnBody.put("status", "RETURNED");

        mockMvc.perform(put("/api/inventory/borrow/" + borrowId + "/status")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(returnBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("RETURNED"));

        // Verify available quantity restored
        updatedItem = inventoryItemRepository.findById(itemId).orElseThrow();
        assertEquals(10, updatedItem.getAvailableQuantity());
    }

    @Test
    void testPollFlow() throws Exception {
        // 1. Admin creates a poll
        Map<String, Object> pollBody = new HashMap<>();
        pollBody.put("title", "Camping Trip");
        pollBody.put("description", "Choose next destination");
        pollBody.put("options", Arrays.asList("Vung Tau", "Dalat"));
        pollBody.put("allowMultiple", false);
        pollBody.put("expiresAt", LocalDateTime.now().plusDays(5).toString());

        MvcResult result = mockMvc.perform(post("/api/polls")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(pollBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Camping Trip"))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<String, Object> dataMap = (Map<String, Object>) responseMap.get("data");
        Long pollId = ((Number) dataMap.get("id")).longValue();
        List<Map<String, Object>> optionsList = (List<Map<String, Object>>) dataMap.get("options");
        Long optionId = ((Number) optionsList.get(0).get("id")).longValue();

        // 2. Member votes
        Map<String, List<Long>> voteBody = new HashMap<>();
        voteBody.put("optionIds", Collections.singletonList(optionId));

        mockMvc.perform(post("/api/polls/" + pollId + "/vote")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(voteBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("anh.pham@club.com").roles("MEMBER")))
                .andExpect(status().isOk());

        // 3. View results
        mockMvc.perform(get("/api/polls/" + pollId + "/results")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("anh.pham@club.com").roles("MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].votesCount").value(1));
    }

    @Test
    void testPublicEventTicketing() throws Exception {
        // 1. Make event public
        event.setIsPublic(true);
        event = eventRepository.save(event);

        // 2. Guest registers for ticket
        Map<String, String> registerBody = new HashMap<>();
        registerBody.put("fullName", "Alex Guest");
        registerBody.put("email", "alex@guest.com");
        registerBody.put("phone", "0909999888");

        MvcResult result = mockMvc.perform(post("/api/public/events/" + event.getId() + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerBody)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Alex Guest"))
                .andExpect(jsonPath("$.data.ticketCode").exists())
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        Map<String, Object> responseMap = objectMapper.readValue(responseStr, Map.class);
        Map<String, Object> dataMap = (Map<String, Object>) responseMap.get("data");
        String ticketCode = (String) dataMap.get("ticketCode");

        // 3. Admin checks in the ticket
        Map<String, String> checkInBody = new HashMap<>();
        checkInBody.put("ticketCode", ticketCode);

        mockMvc.perform(post("/api/events/tickets/check-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(checkInBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CHECKED_IN"));
    }

    @Test
    void testResourceDrive() throws Exception {
        // 1. Admin creates a resource
        ResourceItem resource = ResourceItem.builder()
                .name("CLB Bylaws")
                .description("Official bylaws doc")
                .type(ResourceItem.ResourceType.LINK)
                .category(ResourceItem.ResourceCategory.BYLAWS)
                .url("http://example.com/bylaws")
                .build();

        mockMvc.perform(post("/api/resources")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resource))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin@club.com").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("CLB Bylaws"));

        // 2. Member lists resources
        mockMvc.perform(get("/api/resources")
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("anh.pham@club.com").roles("MEMBER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("CLB Bylaws"));
    }

    @Test
    void testManagerDepartmentScopeConstraints() throws Exception {
        // Create another department
        Department otherDept = new Department();
        otherDept.setName("Ban Doi Ngoai");
        otherDept.setDescription("External Relations");
        otherDept = departmentRepository.save(otherDept);

        // Create manager for other department
        User otherManager = User.builder()
                .fullName("Other Manager")
                .email("other.manager@club.com")
                .passwordHash("hashedpassword")
                .role(User.Role.MANAGER)
                .department(otherDept)
                .isActive(true)
                .build();
        otherManager = userRepository.save(otherManager);

        // Create recruitment application for Ban Chuyen Mon (department)
        RecruitmentApplication application = RecruitmentApplication.builder()
                .fullName("Candidate For Technical")
                .email("tech.cand@example.com")
                .phone("0901234567")
                .departmentId(department.getId())
                .introduction("I love tech")
                .build();
        application = recruitmentRepository.save(application);

        // 1. Other manager tries to retrieve technical candidate by ID -> Expect 400 Bad Request
        mockMvc.perform(get("/api/recruitment/" + application.getId())
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("other.manager@club.com").roles("MANAGER")))
                .andExpect(status().isBadRequest());

        // 2. Other manager tries to evaluate technical candidate -> Expect 400 Bad Request
        Map<String, Object> evalData = new HashMap<>();
        evalData.put("score", 90);
        evalData.put("comments", "Failed check");
        evalData.put("status", "INTERVIEW_SCHEDULED");

        mockMvc.perform(put("/api/recruitment/" + application.getId() + "/evaluate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(evalData))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("other.manager@club.com").roles("MANAGER")))
                .andExpect(status().isBadRequest());

        // 3. Technical manager (son.tran) tries to create team for other department -> Expect 400 Bad Request
        Map<String, Object> teamBody = new HashMap<>();
        teamBody.put("name", "Doi Bong Da");
        teamBody.put("description", "Doi bong da");
        teamBody.put("departmentId", otherDept.getId());

        mockMvc.perform(post("/api/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(teamBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isBadRequest());

        // 4. Technical manager creates team for own department -> Succeeds
        Map<String, Object> myTeamBody = new HashMap<>();
        myTeamBody.put("name", "Doi Dev");
        myTeamBody.put("description", "Doi dev");
        myTeamBody.put("departmentId", department.getId());

        MvcResult teamResult = mockMvc.perform(post("/api/teams")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(myTeamBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("son.tran@club.com").roles("MANAGER")))
                .andExpect(status().isOk())
                .andReturn();

        String teamStr = teamResult.getResponse().getContentAsString();
        Map<String, Object> teamResponse = objectMapper.readValue(teamStr, Map.class);
        Map<String, Object> teamData = (Map<String, Object>) teamResponse.get("data");
        Long teamId = ((Number) teamData.get("id")).longValue();

        // 5. Other manager tries to add member to technical manager's team -> Expect 400 Bad Request
        Map<String, Object> memberBody = new HashMap<>();
        memberBody.put("userId", member.getId());

        mockMvc.perform(post("/api/teams/" + teamId + "/members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(memberBody))
                .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("other.manager@club.com").roles("MANAGER")))
                .andExpect(status().isBadRequest());
    }
}
