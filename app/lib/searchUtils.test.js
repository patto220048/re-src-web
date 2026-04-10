import { searchResourcesClient, getOrBuildSearchIndex } from "./searchUtils";
import { getDocs } from "firebase/firestore";

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock("./firebase", () => ({
  db: {},
}));

describe("searchUtils", () => {
  const mockData = [
    { id: "1", name: "Fire loop sound", tags: ["fire", "loop"], category: "sfx" },
    { id: "2", name: "Water splash", tags: ["water", "nature"], category: "nature" },
    { id: "3", name: "Crying meme video", tags: ["funny", "crying"], category: "meme" },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    
    // Default mock data for all tests
    getDocs.mockResolvedValue({
      docs: mockData.map(item => ({
        id: item.id,
        data: () => item
      }))
    });
  });

  it("should fetch from Firestore and build index when cache is empty", async () => {
    getDocs.mockResolvedValue({
      docs: mockData.map(item => ({
        id: item.id,
        data: () => item
      }))
    });

    // Use getOrBuildSearchIndex(true) first to clear module state in test
    await getOrBuildSearchIndex(true);
    const results = await searchResourcesClient("fire");
    
    expect(getDocs).toHaveBeenCalledTimes(1);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain("Fire");
    expect(sessionStorage.getItem("dam_search_index")).not.toBeNull();
  });

  it("should use session cache on second call", async () => {
    // Manually populate cache
    sessionStorage.setItem("dam_search_index", JSON.stringify(mockData));
    sessionStorage.setItem("dam_search_index_time", Date.now().toString());

    // Call search - should NOT call Firestore
    const results = await searchResourcesClient("water");
    
    expect(getDocs).not.toHaveBeenCalled();
    expect(results[0].name).toBe("Water splash");
  });

  it("should handle fuzzy matching correctly (typo tolerance)", async () => {
    sessionStorage.setItem("dam_search_index", JSON.stringify(mockData));
    sessionStorage.setItem("dam_search_index_time", Date.now().toString());

    // Search for "firee" instead of "fire" (fuzzy matching)
    await getOrBuildSearchIndex(true);
    const results = await searchResourcesClient("firee");
    
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("Fire loop sound");
  });

  it("should return empty array for empty search term", async () => {
    const results = await searchResourcesClient("");
    expect(results).toEqual([]);
    expect(getDocs).not.toHaveBeenCalled();
  });
});
