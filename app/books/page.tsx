"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DashboardLayout } from "@/components/dashboard-layout";
import { BookForm } from "@/components/books/book-form";
import { DeleteBookDialog } from "@/components/books/delete-book-dialog";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface Book {
	id: string;
	name: string;
	testament: string;
	orderIndex: number;
}

export default function BooksPage() {
	const [books, setBooks] = useState<Book[]>([]);
	const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [testamentFilter, setTestamentFilter] = useState("all");
	const [showBookForm, setShowBookForm] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedBook, setSelectedBook] = useState<Book | null>(null);

	const { toast } = useToast();

	const fetchBooks = async () => {
		try {
			setIsLoading(true);
			const response = await apiClient.getBooks();
			if (response.success && response.data) {
				setBooks(response.data);
				setFilteredBooks(response.data);
			}
		} catch (error) {
			console.error("Failed to fetch books:", error);
			toast({
				title: "Error",
				description: "Failed to load books",
				variant: "destructive",
			});
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchBooks();
	}, []);

	useEffect(() => {
		let filtered = books;

		if (searchTerm) {
			filtered = filtered.filter((book) =>
				book.name.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}

		if (testamentFilter !== "all") {
			filtered = filtered.filter((book) => book.testament === testamentFilter);
		}

		setFilteredBooks(filtered);
	}, [books, searchTerm, testamentFilter]);

	const handleCreateBook = () => {
		setSelectedBook(null);
		setShowBookForm(true);
	};

	const handleEditBook = (book: Book) => {
		setSelectedBook(book);
		setShowBookForm(true);
	};

	const handleDeleteBook = (book: Book) => {
		setSelectedBook(book);
		setShowDeleteDialog(true);
	};

	const handleFormSuccess = () => {
		fetchBooks();
	};

	const getTestamentBadgeVariant = (testament: string) => {
		switch (testament) {
			case "OLD":
				return "default";
			case "NEW":
				return "secondary";
			case "CUSTOM":
				return "outline";
			default:
				return "default";
		}
	};

	const getTestamentLabel = (testament: string) => {
		switch (testament) {
			case "OLD":
				return "Old Testament";
			case "NEW":
				return "New Testament";
			case "CUSTOM":
				return "Custom";
			default:
				return testament;
		}
	};

	if (isLoading) {
		return (
			<DashboardLayout>
				<div className="flex items-center justify-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</DashboardLayout>
		);
	}

	return (
		<DashboardLayout>
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-lg font-semibold md:text-2xl">Books Management</h1>
					<p className="text-muted-foreground">
						Manage Yahuah Dabar books and testaments
					</p>
				</div>
				<Button onClick={handleCreateBook}>
					<Plus className="mr-2 h-4 w-4" />
					Add Book
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Books</CardTitle>
					<CardDescription>
						A list of all books in the Bible database. You can create, edit, and
						delete books.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-4 mb-6">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search books..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-8"
							/>
						</div>
						<Select
							value={testamentFilter}
							onValueChange={setTestamentFilter}>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Filter by testament" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Testaments</SelectItem>
								<SelectItem value="OLD">Old Testament</SelectItem>
								<SelectItem value="NEW">New Testament</SelectItem>
								<SelectItem value="CUSTOM">Custom</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{filteredBooks.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								{books.length === 0
									? "No books found. Create your first book!"
									: "No books match your search criteria."}
							</p>
						</div>
					) : (
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Name</TableHead>
										<TableHead>Testament</TableHead>
										<TableHead>Order Index</TableHead>
										<TableHead className="w-[100px]">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{filteredBooks.map((book) => (
										<TableRow key={book.id}>
											<TableCell className="font-medium">{book.name}</TableCell>
											<TableCell>
												<Badge variant={getTestamentBadgeVariant(book.testament)}>
													{getTestamentLabel(book.testament)}
												</Badge>
											</TableCell>
											<TableCell>{book.orderIndex}</TableCell>
											<TableCell>
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button
															variant="ghost"
															className="h-8 w-8 p-0">
															<span className="sr-only">Open menu</span>
															<MoreHorizontal className="h-4 w-4" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem onClick={() => handleEditBook(book)}>
															<Edit className="mr-2 h-4 w-4" />
															Edit
														</DropdownMenuItem>
														<DropdownMenuItem
															onClick={() => handleDeleteBook(book)}
															className="text-destructive">
															<Trash2 className="mr-2 h-4 w-4" />
															Delete
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</CardContent>
			</Card>

			<BookForm
				book={selectedBook}
				open={showBookForm}
				onOpenChange={setShowBookForm}
				onSuccess={handleFormSuccess}
			/>

			<DeleteBookDialog
				book={selectedBook}
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				onSuccess={handleFormSuccess}
			/>
		</DashboardLayout>
	);
}
