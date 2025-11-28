import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useState } from "react";

export default function App() {
  const queryClient = useQueryClient();
  const [notification, setNotification] = useState({ show: false, message: "", type: "" });

  // Show notification helper function
  const showNotification = (message, type = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Fetch Products
  const fetchProductData = async () => {
    const res = await axios.get("https://dummyjson.com/products");
    return res.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProductData,
    staleTime: 1000 * 60 * 10,
  });

  // Add Product
  const addProductMutation = useMutation({
    mutationFn: async (newProduct) => {
      const res = await axios.post("https://dummyjson.com/products/add", newProduct);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showNotification(`Product "${data.title}" added successfully!`, "success");
    },
    onError: (error) => {
      showNotification(`Failed to add product: ${error.message}`, "error");
    }
  });

  // Update Product
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, updatedData }) => {
      const res = await axios.put(`https://dummyjson.com/products/${id}`, updatedData);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showNotification(`Product "${data.title}" updated successfully!`, "success");
    },
    onError: (error) => {
      showNotification(`Failed to update product: ${error.message}`, "error");
    }
  });

  // Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const res = await axios.delete(`https://dummyjson.com/products/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      showNotification(`Product "${data.title}" deleted successfully!`, "success");
    },
    onError: (error) => {
      showNotification(`Failed to delete product: ${error.message}`, "error");
    }
  });

  // Local form state
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    price: "",
    thumbnail: "",
  });

  const handleAddProduct = () => {
    if (!newProduct.title) {
      showNotification("Title is required!", "error");
      return;
    }
    addProductMutation.mutate(newProduct);
    setNewProduct({ title: "", description: "", price: "", thumbnail: "" });
  };

  return (
    <div className="p-4">
      {/* Notification */}
      {notification.show && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-md shadow-lg border-l-4 ${
            notification.type === "success"
              ? "bg-green-100 border-green-500 text-green-700"
              : "bg-red-100 border-red-500 text-red-700"
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === "success" ? "✅" : "❌"}
            </span>
            {notification.message}
          </div>
        </div>
      )}

      {/* Add Product Form */}
      <div className="mb-4 p-2 border rounded shadow">
        <h2 className="text-lg font-bold mb-2">Add Product</h2>
        
        {/* Mutation Loading States */}
        {(addProductMutation.isPending || updateProductMutation.isPending || deleteProductMutation.isPending) && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-2 rounded mb-2">
            Processing request...
          </div>
        )}

        <input
          type="text"
          placeholder="Title"
          value={newProduct.title}
          onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
          className="border p-1 m-1 rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
          className="border p-1 m-1 rounded"
        />
        <input
          type="number"
          placeholder="Price"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
          className="border p-1 m-1 rounded"
        />
        <input
          type="text"
          placeholder="Thumbnail URL"
          value={newProduct.thumbnail}
          onChange={(e) => setNewProduct({ ...newProduct, thumbnail: e.target.value })}
          className="border p-1 m-1 rounded"
        />
        <button
          onClick={handleAddProduct}
          disabled={addProductMutation.isPending}
          className={`p-2 rounded mt-2 ${
            addProductMutation.isPending
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {addProductMutation.isPending ? "Adding..." : "Add Product"}
        </button>
      </div>

      {/* Display Products */}
      {isLoading ? (
        <h1>Loading...</h1>
      ) : isError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error loading products: {error.message}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {data?.products?.slice(0, 5)?.map((product) => (
            <div
              key={product.id}
              className="border border-gray-300 rounded p-2 flex flex-col items-center shadow"
            >
              <p className="text-lg font-semibold">{product.title}</p>
              <img
                src={product.thumbnail}
                alt={product.title}
                className="w-full h-40 object-cover rounded bg-gray-200"
              />
              <p className="text-sm text-gray-600 mt-1">{product.description}</p>
              <p className="text-sm font-medium mt-1">Price: ${product.price}</p>

              <div className="flex gap-2 mt-2">
                <button
                  className={`p-1 rounded ${
                    updateProductMutation.isPending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                  onClick={() =>
                    updateProductMutation.mutate({
                      id: product.id,
                      updatedData: { title: product.title + " (Updated)" },
                    })
                  }
                  disabled={updateProductMutation.isPending}
                >
                  {updateProductMutation.isPending ? "Updating..." : "Update"}
                </button>
                <button
                  className={`p-1 rounded ${
                    deleteProductMutation.isPending
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 hover:bg-red-600 text-white"
                  }`}
                  onClick={() => deleteProductMutation.mutate(product.id)}
                  disabled={deleteProductMutation.isPending}
                >
                  {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>

              {/* Individual mutation status for each product */}
              {(updateProductMutation.variables?.id === product.id && updateProductMutation.isPending) && (
                <div className="text-blue-500 text-xs mt-1">Updating...</div>
              )}
              {(deleteProductMutation.variables === product.id && deleteProductMutation.isPending) && (
                <div className="text-red-500 text-xs mt-1">Deleting...</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}